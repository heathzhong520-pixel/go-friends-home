declare module "ali-oss" {
  type Options = {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    secure?: boolean;
  };

  type SignatureOptions = {
    expires?: number;
    response?: Record<string, string>;
  };

  export default class OSS {
    constructor(options: Options);
    signatureUrl(objectKey: string, options?: SignatureOptions): string;
  }
}
