import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostStatus } from './entity/post.entity';
import { ClientSession, Connection, Model, PipelineStage, Types } from 'mongoose';
import { PostComment, PostCommentDocument } from './entity/post-comment.entity';
import { PostLike, PostLikeDocument } from './entity/post-like.entity';
import { PostMedia, PostMediaDocument, PostMediaType } from './entity/post-media.entity';
import { CreatePostDto, CreatePostMediaDto } from './dto/create-post.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { AppException } from 'src/common/exeptions/app.exeption';
import { CreatePostCommentDto } from './dto/create-comment.dto';
import { KafkaService } from 'src/kafka/kalfka.service';

@Injectable()
export class PostService implements OnModuleInit {
    private readonly logger = new Logger(PostService.name);
    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
        @InjectModel(PostComment.name) private readonly postCommentModel: Model<PostCommentDocument>,
        @InjectModel(PostLike.name) private readonly postLikeModel: Model<PostLikeDocument>,
        @InjectModel(PostMedia.name) private readonly postMediaModel: Model<PostMediaDocument>,
        @InjectConnection() private readonly connection: Connection,
        private readonly cloudinaryService: CloudinaryService,
        private readonly kafkaService: KafkaService
    ) { }


    //CRÚD
    onModuleInit() {

    }

    async createPost(userId: Types.ObjectId, createPostDto: CreatePostDto) {
        const session = await this.connection.startSession()
        session.startTransaction()
        try {
            const newPost = new this.postModel({
                userId: userId,
                content: createPostDto.content
            });
            const savedPost = await newPost.save({ session })
            if (
                createPostDto.medias
            ) {
                for (const media of createPostDto.medias) {
                    await this.createMedia(media, newPost._id, session)
                }
            }
            await session.commitTransaction();
            await this.kafkaService.sendMessage('media-content-moderation-topic', { postId: savedPost._id })
        } catch (error) {
            this.logger.debug(error)
            await session.abortTransaction()
        } finally {
            await session.endSession()
        }
    }

    async updatePost(
        postId: Types.ObjectId,
        userId: Types.ObjectId,
        updateDto: UpdatePostDto
    ) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const post = await this.postModel.findOne({ _id: postId, userId });
            if (!post) throw new Error('Post not found');

            if (updateDto.content !== undefined) {
                post.content = updateDto.content;
                await post.save({ session });
            }

            if (updateDto.mediasToRemove && updateDto.mediasToRemove.length > 0) {
                for (const mediaId of updateDto.mediasToRemove) {
                    await this.postMediaModel.deleteOne({ _id: mediaId, postId }, { session });
                }
            }

            if (updateDto.mediasToAdd && updateDto.mediasToAdd.length > 0) {
                for (const media of updateDto.mediasToAdd) {
                    await this.createMedia(media, postId, session);
                }
            }

            await session.commitTransaction();
            return await this.postModel.findById(postId).populate('mediaList');
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async deletePost(postId: Types.ObjectId, userId: Types.ObjectId) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const post = await this.postModel.findOne({ _id: postId, userId });
            if (!post) throw new AppException("Post not available", 404);

            await this.postMediaModel.deleteMany({ postId }, { session });
            await this.postCommentModel.deleteMany({ postId }, { session });
            await this.postLikeModel.deleteMany({ postId }, { session });
            await this.postModel.deleteOne({ _id: postId }, { session });

            await session.commitTransaction();
            return { deleted: true };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }


    async getPosts(page = 1, limit = 10, userId: Types.ObjectId) {
        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;
        const pipeline: PipelineStage[] = [
            { $match: { status: PostStatus.VERIFIED } },
            {
                $lookup: {
                    from: "postmedias",
                    localField: "_id",
                    foreignField: "postId",
                    as: "mediaList"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                        { $project: { _id: 1, name: 1, avatar: 1 } }
                    ],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "postlikes",
                    let: { postId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
                        {
                            $group: {
                                _id: null,
                                totalLikes: { $sum: 1 },
                                likedByMe: {
                                    $max: {
                                        $cond: [{ $eq: ["$userId", userId] }, true, false]
                                    }
                                }
                            }
                        }
                    ],
                    as: "likeInfo"
                }
            },
            {
                $addFields: {
                    totalLikes: { $ifNull: [{ $arrayElemAt: ["$likeInfo.totalLikes", 0] }, 0] },
                    likedByMe: { $ifNull: [{ $arrayElemAt: ["$likeInfo.likedByMe", 0] }, false] },
                    user: {
                        _id: "$user._id",
                        name: "$user.name",
                        avatar: "$user.avatar"
                    }
                }
            },
            {
                $unset: ["likeInfo"]
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNumber }
        ];
        const posts = await this.postModel.aggregate(pipeline);
        const total = await this.postModel.countDocuments();
        return {
            data: posts,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getPostById(postId: Types.ObjectId, userId: Types.ObjectId) {
        const pipeline: PipelineStage[] = [
            { $match: { _id: postId } },
            {
                $lookup: {
                    from: "postmedias",
                    localField: "_id",
                    foreignField: "postId",
                    as: "mediaList"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                        { $project: { _id: 1, name: 1, avatar: 1 } }
                    ],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "postlikes",
                    let: { postId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
                        {
                            $group: {
                                _id: null,
                                totalLikes: { $sum: 1 },
                                likedByMe: {
                                    $max: {
                                        $cond: [{ $eq: ["$userId", userId] }, true, false]
                                    }
                                }
                            }
                        }
                    ],
                    as: "likeInfo"
                }
            },
            {
                $addFields: {
                    totalLikes: { $ifNull: [{ $arrayElemAt: ["$likeInfo.totalLikes", 0] }, 0] },
                    likedByMe: { $ifNull: [{ $arrayElemAt: ["$likeInfo.likedByMe", 0] }, false] },
                    user: {
                        _id: "$user._id",
                        name: "$user.name",
                        avatar: "$user.avatar"
                    }
                }
            },
            { $unset: ["likeInfo"] }
        ];

        const posts = await this.postModel.aggregate(pipeline);
        return posts[0] || null;
    }





    async getMyPosts(userId: Types.ObjectId) {
        const pipeline: PipelineStage[] = [
            { $match: { userId } },
            {
                $lookup: {
                    from: "postmedias",
                    localField: "_id",
                    foreignField: "postId",
                    as: "mediaList"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                        { $project: { _id: 1, name: 1, avatar: 1 } }
                    ],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "postlikes",
                    let: { postId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
                        {
                            $group: {
                                _id: null,
                                totalLikes: { $sum: 1 },
                                likedByMe: {
                                    $max: {
                                        $cond: [{ $eq: ["$userId", userId] }, true, false]
                                    }
                                }
                            }
                        }
                    ],
                    as: "likeInfo"
                }
            },
            {
                $addFields: {
                    totalLikes: { $ifNull: [{ $arrayElemAt: ["$likeInfo.totalLikes", 0] }, 0] },
                    likedByMe: { $ifNull: [{ $arrayElemAt: ["$likeInfo.likedByMe", 0] }, false] },
                    user: {
                        _id: "$user._id",
                        name: "$user.name",
                        avatar: "$user.avatar"
                    }
                }
            },
            {
                $unset: ["likeInfo"]
            },
            { $sort: { createdAt: -1 } },
        ];
        const posts = await this.postModel.aggregate(pipeline);
        return {
            data: posts,
        };
    }

    async likePostToggle(userId: Types.ObjectId, postId: Types.ObjectId) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const postExists = await this.postModel.exists({ _id: postId });
            if (!postExists) throw new AppException("Post not available", 404);

            const existingLike = await this.postLikeModel.findOne({ userId, postId }).session(session);

            let likedByMe: boolean;
            if (existingLike) {
                await this.postLikeModel.deleteOne({ _id: existingLike._id }, { session });
                likedByMe = false;
            } else {
                const newLike = new this.postLikeModel({ userId, postId });
                await newLike.save({ session });
                likedByMe = true;
            }

            const totalLikes = await this.postLikeModel.countDocuments({ postId }).session(session);

            await session.commitTransaction();
            return {
                likedByMe,
                totalLikes,
                postId
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }


    async commentPost(userId: Types.ObjectId, comment: CreatePostCommentDto) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const post = await this.postModel.findById(comment.postId).session(session);
            if (!post) {
                throw new AppException("Post not available", 404);
            }

            if (comment.parent_id) {
                const parentComment = await this.postCommentModel.findById(comment.parent_id).session(session);
                if (!parentComment) {
                    throw new AppException("Bình luận không tồn tại", 404);
                }
            }

            if (comment.root_id) {
                const rootComment = await this.postCommentModel.findById(comment.root_id).session(session);
                if (!rootComment) {
                    throw new AppException("Bình luận không tồn tại", 404);
                }
            }

            const newComment = new this.postCommentModel({
                userId,
                postId: new Types.ObjectId(comment.postId),
                parent_id: comment.parent_id ? new Types.ObjectId(comment.parent_id) : null,
                root_id: comment.root_id ? new Types.ObjectId(comment.root_id) : null,
                content: comment.content,
                replyRegex:comment.replyRegex
            });

            await newComment.save({ session });

            // Populate thông tin user
            await newComment.populate({
                path: "userId",
                select: "_id name avatar",
            });

            const result = newComment.toObject();

            // commit transaction
            await session.commitTransaction();
            let replyCount: number | undefined = undefined
            if (!result.root_id) {
                replyCount = 0
            }
            const { userId: user, ...rest } = result
            return { user, ...rest, replyCount }
        } catch (error) {
            await session.abortTransaction();
            this.logger.error(`commentPost error: ${error.message}`, error.stack);
            throw error;
        } finally {
            session.endSession();
        }
    }


    async getCommentsWithReplyCount(
        postId: Types.ObjectId,
        page: number = 1,
        limit: number = 10,
        sort: 'asc' | 'desc' = 'desc'
    ) {
        const skip = (page - 1) * limit;
        const totalComments = await this.postCommentModel.countDocuments({
            postId,
            parent_id: null,
        });
        const comments = await this.postCommentModel.aggregate([
            { $match: { postId, parent_id: null } },
            { $sort: { createdAt: sort === 'desc' ? -1 : 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'postcomments',
                    let: { commentId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$root_id', '$$commentId'] } } },
                        { $count: 'replyCount' }
                    ],
                    as: 'replies',
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                        { $project: { _id: 1, name: 1, avatar: 1 } }
                    ],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    replyCount: { $ifNull: [{ $arrayElemAt: ['$replies.replyCount', 0] }, 0] },
                    user: {
                        _id: "$user._id",
                        name: "$user.name",
                        avatar: "$user.avatar"
                    }
                }
            },
            { $project: { replies: 0 } }
        ]);

        return {
            page,
            limit,
            totalPages: Math.ceil(totalComments / limit),
            totalComments,
            data: comments
        };

    }


    async getRepliesOfComment(
        commentId: Types.ObjectId,
        page: number = 1,
        limit: number = 10,
        sort: 'asc' | 'desc' = 'asc'
    ) {
        const skip = (page - 1) * limit;

        const parentComment = await this.postCommentModel.findById(commentId);
        if (!parentComment) {
            throw new AppException('Bình luận không tồn tại', 404);
        }

        const totalReplies = await this.postCommentModel.countDocuments({
            root_id: commentId
        });

        const replies = await this.postCommentModel
            .find({ root_id: commentId })
            .populate({
                path: 'userId',
                select: 'name avatar _id'
            })
            .sort({ createdAt: sort === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return {
            parentCommentId: commentId,
            page,
            limit,
            totalPages: Math.ceil(totalReplies / limit),
            totalReplies,
            data: replies
        };
    }














    // Helpers
    async createMedia(
        createPostMediaDto: CreatePostMediaDto,
        postId: Types.ObjectId,
        session?: ClientSession
    ) {
        try {
            let url: string;

            if (createPostMediaDto.type === PostMediaType.VIDEO) {
                url = await this.cloudinaryService.uploadVideo(createPostMediaDto.file);
            } else if (createPostMediaDto.type === PostMediaType.IMAGE) {
                url = await this.cloudinaryService.uploadImage(createPostMediaDto.file);
            } else {
                throw new Error('Unsupported media type');
            }

            const postMedia = new this.postMediaModel(
                {
                    type: createPostMediaDto.type,
                    url,
                    postId
                }
            );

            await postMedia.save({ session });
            return postMedia;
        } catch (error) {
            this.logger.error(`Error creating media for post ${postId}: ${error.message}`, error.stack);
            throw error;
        }
    }
}
