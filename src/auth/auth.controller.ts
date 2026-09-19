import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { UpdateDto } from './dto/update.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Request() req: { user: JwtPayloadDto }) {
    return this.authService.register(registerDto, req.user.userlogin);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: { user: JwtPayloadDto }) {
    return this.authService.logout(req.user.userlogin);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: { user: JwtPayloadDto }) {
    return { user: req.user, menus: await this.authService.getMenuAuthorization(req.user.groupId) };
  }

  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('users') 
  async editUser(@Body() updateDto: UpdateDto) {
    return this.authService.editUser(updateDto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  @Patch('admin-reset-password') 
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.adminResetPassword(resetPasswordDto);
  }
}