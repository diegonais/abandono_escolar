import { PartialType } from "@nestjs/swagger";
import { CreateStudentFollowUpDto } from "./create-student-follow-up.dto";

export class UpdateStudentFollowUpDto extends PartialType(CreateStudentFollowUpDto) {}
