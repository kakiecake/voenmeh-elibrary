import { IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class AuthorDto {
  @IsString()
  id: string;

  @IsString()
  name: string;
}

export class CreateAuthorDto {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  id?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  name?: string[];

  @ValidateNested()
  @Type(() => AuthorDto)
  newAuthor: AuthorDto;

  // This will be called automatically by Nest's validation pipe
  validate() {
    if (this.id && this.name && this.id.length !== this.name.length) {
      throw new Error('id and name arrays must have the same length');
    }
    return this;
  }

  // Transformation method
  toOutput(): OutputDto {
    const authors: AuthorDto[] = [];

    if (this.id && this.name) {
      for (let i = 0; i < this.id.length; i++) {
        authors.push({ id: this.id[i], name: this.name[i] });
      }
    } else if (this.id || this.name) {
      throw new Error('Both id and name must be provided if one is provided');
    }

    return {
      authors,
      newAuthor: this.newAuthor,
    };
  }
}

export interface OutputDto {
  authors: AuthorDto[];
  newAuthor: AuthorDto;
}
