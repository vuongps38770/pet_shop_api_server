// embedding.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductEmbedding } from './entity/product-embedding.entity';
import axios from 'axios'; // để gọi sang API encode nếu backend FastAPI làm việc này

@Injectable()
export class EmbeddingService {
  constructor(
    @InjectModel('ProductEmbedding') private embeddingModel: Model<ProductEmbedding>,
  ) {}

  async getSimilarProductIds(query: string, topK = 10): Promise<string[]> {
    // Gọi API encode query sang embedding vector
    const response = await axios.post('http://localhost:8000/encode', { text: query });
    const queryEmbedding: number[] = response.data.embedding;

    // Lấy toàn bộ embeddings từ DB
    const allEmbeds = await this.embeddingModel.find().lean();

    const result = allEmbeds
      .map((doc) => {
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        return { product_id: doc.product_id.toString(), similarity };
      })
      .filter((item) => item.similarity > 0.6) // có thể điều chỉnh ngưỡng
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((item) => item.product_id);

    return result;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }
}
