import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Neo4jError } from 'neo4j-driver';

@Injectable()
export class DbValidateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(err => {
        if (err instanceof Neo4jError && err.code === 'Neo.ClientError.Procedure.ProcedureCallFailed') {
          const msg = err.message || '';

          // Un conflicto de unicidad...
          if (msg.includes('already exists')) {
            throw new HttpException(
              { code: 'CONFLICT', message: msg },
              HttpStatus.CONFLICT
            );
          }

          // Un recurso no encontrado / validación de existencia...
          if (msg.includes('not found') || msg.includes('not exist')) {
            throw new HttpException(
              { code: 'BAD_REQUEST', message: msg },
              HttpStatus.BAD_REQUEST
            );
          }

          // Cualquier otro fallo de validate lo devolvemos también como BAD_REQUEST
          throw new HttpException(
            { code: 'BAD_REQUEST', message: msg },
            HttpStatus.BAD_REQUEST
          );
        }

        // No es un error de apoc.validate: lo dejamos pasar
        return throwError(() => err);
      })
    );
  }
}
