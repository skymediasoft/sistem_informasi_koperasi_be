import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateDto } from './dto/update.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) { }

  @Get()
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch()
  async editUser(@Body() updateDto: UpdateDto) {
    return this.authService.editUser(updateDto);
  }

  @Patch('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.adminResetPassword(resetPasswordDto);
  }

  @Delete(':userlogin')
  async deleteUser(@Param('userlogin') userlogin: string) {
    return this.authService.deleteUser(userlogin);
  }
}
