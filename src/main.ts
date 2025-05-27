import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtService } from '@nestjs/jwt';
import { RoleGuard } from './api/auth/guards/role.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(new RoleGuard(reflector, jwtService));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
