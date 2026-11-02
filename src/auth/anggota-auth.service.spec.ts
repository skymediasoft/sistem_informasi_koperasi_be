import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AnggotaAuthService } from './anggota-auth.service';
import { AnggotaRepository } from './anggota.repository';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AnggotaAuthService', () => {
  let service: AnggotaAuthService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  const generateTokens = vi.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

  beforeEach(async () => {
    repo = {
      findByNoAnggota: vi.fn(),
      listView: vi.fn(),
      delete: vi.fn(),
      getLoginRow: vi.fn(),
      insertViaProcedure: vi.fn(),
      updateViaProcedure: vi.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        AnggotaAuthService,
        { provide: AnggotaRepository, useValue: repo },
        { provide: AuthService, useValue: { generateTokens } },
      ],
    }).compile();
    service = module.get(AnggotaAuthService);
  });

  it('registerAnggota returns the procedure message', async () => {
    repo.insertViaProcedure.mockResolvedValue('Insert anggota berhasil.');
    await expect(service.registerAnggota({ NoEmployee: 'E1' } as any, 'admin')).resolves.toBe(
      'Insert anggota berhasil.',
    );
    const params = repo.insertViaProcedure.mock.calls[0][0];
    expect(params).toHaveLength(14);
    expect(params[13]).toBe('admin');
  });

  it('updateAnggota passes 16 params, throws on affectedRows 0, otherwise ignores the SP message', async () => {
    repo.updateViaProcedure.mockResolvedValueOnce({ affectedRows: 0, message: 'x' });
    await expect(service.updateAnggota({} as any, 'u', '2026-0001')).rejects.toThrow(BadRequestException);

    repo.updateViaProcedure.mockResolvedValueOnce({ affectedRows: 1, message: 'Error 1062' });
    await expect(service.updateAnggota({} as any, 'u', '2026-0001')).resolves.toEqual({
      statusCode: 200,
      message: 'Data successfully updated.',
    });
    expect(repo.updateViaProcedure.mock.calls[0][0]).toHaveLength(16);
  });

  it('loginAnggota uses AuthService.generateTokens with the member payload', async () => {
    repo.getLoginRow.mockResolvedValue({
      NoEmployee: 'E1', NoAnggota: '2026-0001', Nama: 'N', AlamatEmail: null, DepartmentName: 'D',
      PasswordLogin: await bcrypt.hash('pw', 4),
    });
    await expect(service.loginAnggota({ userlogin: '2026-0001', password: 'pw' })).resolves.toEqual({
      access_token: 'a', refresh_token: 'r', success: 1,
    });
    expect(generateTokens).toHaveBeenCalledWith({
      userlogin: 'E1', noAnggota: '2026-0001', username: 'N', email: '', groupId: 0, groupName: 'D',
    });
  });

  it('deleteAnggota wraps failures as 400', async () => {
    repo.delete.mockRejectedValue(new Error('fk'));
    await expect(service.deleteAnggota('x')).rejects.toThrow('Failed to delete anggota. Error: Error: fk');
  });
});
