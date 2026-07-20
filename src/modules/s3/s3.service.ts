import crypto from 'node:crypto'
import path from 'node:path'

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

import { env } from '../../config/env'
import { s3Client } from './s3.client'
import type { UploadFileInput } from './s3.types'

export const uploadFile = async (
  file: UploadFileInput,
  folder: string
): Promise<string> => {
  const originalName = file.originalname || 'upload'
  const ext = path.extname(originalName).toLowerCase()
  const extPart = ext || ''

  const key = `${folder}/${crypto.randomUUID()}${extPart}`
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  )

  return buildPublicUrlForKey(key)
}

export const buildPublicUrlForKey = (key: string): string => {
  const baseUrl = env.STORAGE_BASE_URL.replace(/\/$/, '')
  return `${baseUrl}/${key}`
}

export const buildS3PublicUrlForKey = (key: string): string => {
  const baseUrl = env.AWS_S3_BASE_URL.replace(/\/$/, '')
  return `${baseUrl}/${key}`
}

export const uploadFileAtKey = async (
  file: UploadFileInput,
  key: string
): Promise<string> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  )
  return buildPublicUrlForKey(key)
}

export const uploadPdfBufferAtKey = async (
  buffer: Buffer,
  key: string
): Promise<string> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
  )
  return buildPublicUrlForKey(key)
}

export const uploadPngBufferAtKey = async (
  buffer: Buffer,
  key: string
): Promise<string> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    })
  )
  return buildPublicUrlForKey(key)
}

export const copyObjectByKey = async (
  sourceKey: string,
  destinationKey: string
): Promise<void> => {
  const source = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: sourceKey,
    })
  )
  const bytes = source.Body
    ? await source.Body.transformToByteArray()
    : new Uint8Array()
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: destinationKey,
      Body: Buffer.from(bytes),
      ContentType: source.ContentType || 'application/octet-stream',
    })
  )
}

export const deleteObjectByKey = async (key: string): Promise<void> => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
    })
  )
}

export const objectExistsByKey = async (key: string): Promise<boolean> => {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

export const getObjectByKey = async (
  key: string
): Promise<{ body: unknown; contentType: string }> => {
  const out = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
    })
  )
  if (!out.Body) {
    throw new NoSuchKey({ $metadata: {}, message: 'Object body missing' })
  }
  return {
    body: out.Body,
    contentType: out.ContentType || 'application/octet-stream',
  }
}
