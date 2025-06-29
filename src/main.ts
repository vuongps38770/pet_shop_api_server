import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtService } from '@nestjs/jwt';
import { RoleGuard } from './api/auth/guards/role.guard';
import { TransformInterceptor } from './common/interceptors/transform-interceptor';
import { AllExceptionsInterceptor } from './common/interceptors/exception-interceptor';
import { AuthGuard } from './api/auth/guards/auth-guard';
import chalk from 'chalk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(new RoleGuard(reflector, jwtService));
  app.useGlobalGuards(new AuthGuard(reflector, jwtService));
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new AllExceptionsInterceptor());
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
  const signature = ` 
 ___      ___ ___  ___  ________  ________   ________          ________  ________    
|\\  \\    /  /|\\  \\|\\  \\|\\   __  \\|\\   ___  \\|\\   ____\\        |\\   ___ \\|\\_____  \\    
\\ \\  \\  /  / | \\  \\\\\\  \\ \\  \\|\\  \\ \\  \\\\ \\  \\ \\  \\___|        \\ \\  \\_|\\ \\\\|___/  /|   
 \\ \\  \\/  / / \\ \\  \\\\\\  \\ \\  \\\\\\  \\ \\  \\\\ \\  \\ \\  \\  ___       \\ \\  \\ \\\\ \\   /  / /   
  \\ \\    / /   \\ \\  \\\\\\  \\ \\  \\\\\\  \\ \\  \\\\ \\  \\ \\  \\|\\  \\       \\ \\  \\_\\\\ \\ /  /_/__  
   \\ \\__/ /     \\ \\_______\\ \\_______\\ \\__\\\\ \\__\\ \\_______\\       \\ \\_______\\\\________\\
    \\|__|/       \\|_______|\\|_______|\\|__| \\|__|\\|_______|        \\|_______|\\|_______|`;

  // const colors = [
  //   chalk.red,
  //   chalk.green,
  //   chalk.yellow,
  //   chalk.blue,
  //   chalk.magenta,
  //   chalk.cyan,
  //   chalk.white,
  // ];

  // const colorizeEachChar = (text: string): string => {
  //   let colored = '';
  //   let colorIndex = 0;

  //   for (const char of text) {
  //     const color = colors[colorIndex % colors.length];
  //     colored += color(char);
  //     if (char !== ' ') colorIndex++;
  //   }

  //   return colored;
  // }

  console.log(signature);
}
bootstrap();
