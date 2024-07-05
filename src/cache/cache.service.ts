import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';

@Injectable()
export class CacheService {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    const redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      retryStrategy: (): number => {
        console.error('auth Redis connection interruption');
        console.error('Retrying');
        return this.configService.get<number>('REDIS_TIMEOUT'); // ms
      },
    });

    this.redisClient = redis;
  }

  get redis(): Redis {
    return this.redisClient;
  }

  async get(key: string): Promise<unknown> {
    try {
      const data = await this.redisClient.get(key);

      return JSON.parse(data);
    } catch (err) {
      console.error(`get: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redisClient.setex(key, ttl, JSON.stringify(value)); // sec
      } else {
        await this.redisClient.set(key, JSON.stringify(value));
      }
    } catch (err) {
      console.error(`set: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (err) {
      console.error(`del: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // hash
  async hGet(key: string, field: string): Promise<unknown> {
    try {
      const value = await this.redisClient.hget(key, field);

      return JSON.parse(value);
    } catch (err) {
      console.error(`hGet: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async hMGet(key: string, fields: string[]): Promise<unknown> {
    try {
      const values = await this.redisClient.hmget(key, ...fields);
      const result = {};

      fields.forEach((field, idx) => {
        result[field] = JSON.parse(values[idx]);
      });

      return result;
    } catch (err) {
      console.error(`hMGet: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async hGetAll(key: string): Promise<unknown> {
    try {
      const values = await this.redisClient.hgetall(key);
      const result = {};

      for (const field of Object.keys(values)) {
        result[field] = JSON.parse(values[field]);
      }

      return result;
    } catch (err) {
      console.error(`hGetAll: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async hSet(key: string, field: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const multi = this.redisClient.multi();

      multi.hset(key, field, JSON.stringify(value));

      if (ttl != null) {
        multi.expire(key, ttl); // sec
      }

      await multi.exec();
    } catch (err) {
      console.error(`hSet: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async hMSet(key: string, values: [field: string, value: unknown][], ttl?: number): Promise<void> {
    try {
      const multi = this.redisClient.multi();

      for (const value of values) {
        multi.hset(key, value[0], JSON.stringify(value[1]));
      }

      if (ttl != null) {
        multi.expire(key, ttl); // sec
      }

      await multi.exec();
    } catch (err) {
      console.error(`hMSet: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async hDel(key: string, fields: string[]): Promise<void> {
    try {
      await this.redisClient.hdel(key, ...fields);
    } catch (err) {
      console.error(`hMdel: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
