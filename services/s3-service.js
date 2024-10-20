const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/aws-config');

class FileUploadService {
    constructor(options = {}) {
        // using options maybe in future we need to setup for different buckets for different regions
        this.s3 = new AWS.S3({
            accessKeyId: options.accessKeyId || config.aws.accessKeyId,
            secretAccessKey: options.secretAccessKey || config.aws.secretAccessKey,
            region: options.region || config.aws.region,
        });
        this.bucketName = options.bucketName || config.aws.bucketName;
    }

    async uploadFile(file) {
        try {
            const fileName = this.generateFileName(file.originalname);
            const params = {
                Bucket: this.bucketName,
                Key: fileName,
                Body: file.buffer,
                ACL: 'public-read',
            };

            const data = await this.s3.upload(params).promise();
            return data.Location;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    generateFileName(originalName) {
        const uniqueId = uuidv4();
        const extension = originalName.split('.').pop();
        const shortName = originalName.substring(0, 15);
        const fileName = `${shortName}-${uniqueId}.${extension}`;
        return fileName;
    }
}

module.exports = FileUploadService;