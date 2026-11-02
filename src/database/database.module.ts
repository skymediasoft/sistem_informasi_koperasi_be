import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';
import { MYSQL_POOL } from './database.constants';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: MYSQL_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createPool({
          host: config.getOrThrow<string>('SQL_HOST'),
          port: Number(config.get('SQL_PORT') ?? 3306), // env values are strings
          user: config.getOrThrow<string>('SQL_USERNAME'), // mysql2 uses `user`
          password: config.getOrThrow<string>('SQL_PASSWORD'),
          database: config.getOrThrow<string>('SQL_DATABASE'),
          waitForConnections: true,
          connectionLimit: Number(config.get('SQL_POOL_LIMIT') ?? 10),
          queueLimit: 0,
          enableKeepAlive: true,
          supportBigNumbers: true,
          bigNumberStrings: true,
          multipleStatements: false,
        }),
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
