export type ImageBannerReqDto={
    startTime:string,
    applicablePeriod?:number,
    images:Express.Multer.File[]
}