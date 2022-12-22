import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  applyDecorators,
  UsePipes,
} from '@nestjs/common';
import { ObjectSchema } from 'joi';
import { IWsData } from 'src/interfaces/ws';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: IWsData<any>, _metadata: ArgumentMetadata) {
    //check payload field for ws message
    const { error, value: joiValue } = this.schema.validate(value.payload);
    if (error) {
      throw new BadRequestException(error.message);
    }
    value.payload = joiValue;
    return value;
  }
}

export const JoiWsPipe = (schema: ObjectSchema) => {
  return applyDecorators(UsePipes(new JoiValidationPipe(schema)));
};
