import { Module } from '@nestjs/common';
import {ConfigModule} from '@nestjs/config'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SfuModule } from './sfu/sfu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    SfuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
