import { Module } from "@nestjs/common";
import { StudentFollowUpsController } from "./student-follow-ups.controller";
import { StudentFollowUpsService } from "./student-follow-ups.service";

@Module({
  controllers: [StudentFollowUpsController],
  providers: [StudentFollowUpsService],
})
export class StudentFollowUpsModule {}
