import { Body, Get, Post, Res, Controller, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { SignInDto } from './dto/sign-in.dto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { AUTH_TOKEN_COOKIE_NAME } from './constants';
import { AuthorizedUser, UserDecorator } from './user.decorator';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller('/')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/login')
  getLoginPage(
    @UserDecorator() user: AuthorizedUser | undefined,
    @Res() res: Response,
  ) {
    if (user) return res.redirect('/');

    // TODO: add CSRF token
    res.render('login');
  }

  @Post('/logout')
  logout(@Res() res: Response) {
    return res
      .cookie(AUTH_TOKEN_COOKIE_NAME, '', {
        sameSite: 'strict',
        secure: true,
        httpOnly: true,
        maxAge: -9999,
      })
      .header('HX-Redirect', '/books')
      .status(200)
      .end();
  }

  @Post('/login')
  async signIn(@Body() body: SignInDto, @Res() res: Response) {
    const authResult = await this.userService.signIn(body.email, body.password);
    if (!authResult) {
      return res.render('partials/auth-form', {
        authError: 'Неверный логин/пароль',
        email: body.email,
      });
    }

    res
      .cookie(AUTH_TOKEN_COOKIE_NAME, authResult.accessToken, {
        sameSite: 'strict',
        secure: true,
        httpOnly: true,
      })
      .header('HX-Redirect', '/')
      .status(200)
      .end();
  }

  @Post('/register')
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    const result = await this.userService.register(body.email, body.password);
    if (!result) {
      return res.render('partials/auth-form', {
        authError: 'Пользователь с таким email адресом уже зарегистрирован',
      });
    }
    res
      .status(200)
      .header('HX-Redirect', '/')
      .cookie(AUTH_TOKEN_COOKIE_NAME, result.accessToken, {
        sameSite: 'strict',
        secure: true,
        httpOnly: true,
      })
      .end();
  }
}
