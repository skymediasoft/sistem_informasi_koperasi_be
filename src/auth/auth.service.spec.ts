import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    repo = {
      findByLogin: vi.fn(),
      existsByLogin: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updatePassword: vi.fn(),
      listLoginView: vi.fn(),
      findGroupNameRows: vi.fn(),
      getLoginRow: vi.fn(),
      getGroupAuthorization: vi.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: repo },
        { provide: JwtService, useValue: { signAsync: vi.fn().mockResolvedValue('tok'), verifyAsync: vi.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: vi.fn().mockReturnValue('secret') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('login rejects unknown user and wrong password with the same 401', async () => {
    repo.getLoginRow.mockResolvedValueOnce(undefined);
    await expect(service.login({ userlogin: 'x', password: 'y' })).rejects.toThrow(UnauthorizedException);

    repo.getLoginRow.mockResolvedValueOnce({ UserLogin: 'x', UserPassword: await bcrypt.hash('right', 4) });
    await expect(service.login({ userlogin: 'x', password: 'wrong' })).rejects.toThrow('Invalid credentials');
  });

  it('login returns tokens for valid credentials', async () => {
    repo.getLoginRow.mockResolvedValue({
      UserLogin: 'x', UserName: 'X', UserEmail: null, GroupID: 1, GroupName: 'G',
      UserPassword: await bcrypt.hash('right', 4),
    });
    await expect(service.login({ userlogin: 'x', password: 'right' })).resolves.toEqual({
      access_token: 'tok', refresh_token: 'tok', success: 1,
    });
  });

  it('register hashes the password, inserts and returns the original response shape', async () => {
    repo.existsByLogin.mockResolvedValue(false);
    repo.findGroupNameRows.mockResolvedValue([{ GroupName: 'G' }]);
    const res = await service.register(
      { userlogin: 'u', username: 'U', password: 'secret1', email: 'u@x.id', groupId: 1 },
      'admin',
    );
    expect(res).toEqual({ access_token: 'tok', refresh_token: 'tok', user: { username: 'u', name: 'U' } });
    const arg = repo.insert.mock.calls[0][0];
    expect(arg).toMatchObject({ userLogin: 'u', postBy: 'admin', groupId: 1 });
    expect(arg.userPassword).not.toBe('secret1');
  });

  it('register conflicts on existing login', async () => {
    repo.existsByLogin.mockResolvedValue(true);
    await expect(
      service.register({ userlogin: 'u', username: 'U', password: 'secret1', email: 'a@b.c' }, 'a'),
    ).rejects.toThrow(ConflictException);
  });

  it('editUser: conflict when changing to an existing login, 400 when nothing matched', async () => {
    repo.existsByLogin.mockResolvedValueOnce(true);
    await expect(
      service.editUser({ userlogin: 'a', userloginInput: 'b', username: 'B', email: 'b@x.id' }),
    ).rejects.toThrow(ConflictException);

    repo.update.mockResolvedValueOnce(0);
    await expect(
      service.editUser({ userlogin: 'a', userloginInput: 'a', username: 'A', email: 'a@x.id' }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.update).toHaveBeenCalledWith('a', expect.objectContaining({ userLogin: 'a' }));
  });

  it('deleteUser and adminResetPassword answer 400 for a missing user', async () => {
    repo.delete.mockResolvedValue(0);
    await expect(service.deleteUser('nope')).rejects.toThrow('User not found');

    repo.findByLogin.mockResolvedValue(null);
    await expect(service.adminResetPassword({ userlogin: 'nope', newPassword: 'abcdef' })).rejects.toThrow(
      'User not found',
    );
    expect(repo.updatePassword).not.toHaveBeenCalled();
  });

  it('adminResetPassword stores a bcrypt hash', async () => {
    repo.findByLogin.mockResolvedValue({ userLogin: 'u' });
    await service.adminResetPassword({ userlogin: 'u', newPassword: 'abcdef' });
    const [login, hash] = repo.updatePassword.mock.calls[0];
    expect(login).toBe('u');
    expect(await bcrypt.compare('abcdef', hash)).toBe(true);
  });
});
