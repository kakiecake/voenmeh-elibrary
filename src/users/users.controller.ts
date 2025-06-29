import { Body, Get, Post, Res, Controller, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { SignInDto } from './dto/sign-in.dto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { AUTH_TOKEN_COOKIE_NAME } from './constants';
import { AuthorizedUser, UserDecorator } from './user.decorator';
import { AuthGuard } from './auth.guard';
import { Protected } from './auth.decorator';
import { USER_ROLES } from './types';

@UseGuards(AuthGuard)
@Controller('/')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  testIndex(
    @UserDecorator() user: AuthorizedUser | undefined,
    @Res() res: Response,
  ) {
    return res.render('index', {
      user,
      isAdmin: user && user.role === USER_ROLES.Admin,
    });
  }

  @Protected
  @Get('/protected')
  testProtected(
    @UserDecorator() user: AuthorizedUser | undefined,
    @Res() res: Response,
  ) {
    return res.render('index', {
      user,
      isAdmin: user && user.role === USER_ROLES.Admin,
    });
  }

  @Get('/login')
  getLoginPage(
    @UserDecorator() user: AuthorizedUser | undefined,
    @Res() res: Response,
  ) {
    if (user) return res.redirect('/');

    // TODO: add CSRF token
    res.render('login');
  }

  @Post('/login')
  async signIn(@Body() body: SignInDto, @Res() res: Response) {
    const authResult = await this.userService.signIn(body.email, body.password);
    if (!authResult) {
      return res.render('partials/auth-form', {
        authError: 'Неверный логин/пароль epta',
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
    const user = await this.userService.register(body.email, body.password);
    if (!user) {
      return res.render('authForm', {
        authError: 'Пользователь с таким email адресом уже зарегистрирован',
      });
    }
    res.status(200).header('HX-Redirect', '/');
  }
}
