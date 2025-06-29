import { Transform } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsNumber,
  IsPositive,
  MaxLength,
  IsNumberString,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber({}, { each: true })
  @IsArray()
  authorIds: number[];

  // @IsPositive()
  // @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseInt(value as string))
  yearCreated: number;

  @MaxLength(4)
  @IsString()
  countryCode: string;
}
