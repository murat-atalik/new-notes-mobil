import { z } from 'zod';

export interface BilingualError {
  tr: string;
  en: string;
}

export type FieldErrors = Record<string, BilingualError>;

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: BilingualError;
  fieldErrors?: FieldErrors;
}

/**
 * Format helper for bilingual error message string
 */
export function formatBilingualMessage(err?: BilingualError): string {
  if (!err) return '';
  return err.tr || err.en;
}

/**
 * Helper to transform Zod issues into structured BilingualError
 */
export function handleZodValidation<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: FieldErrors = {};
  let firstError: BilingualError | undefined;

  for (const issue of result.error.issues) {
    let parsedMessage: BilingualError;
    try {
      parsedMessage = JSON.parse(issue.message);
    } catch {
      parsedMessage = { tr: issue.message, en: issue.message };
    }

    const field = issue.path[0] ? String(issue.path[0]) : '_global';
    if (!fieldErrors[field]) {
      fieldErrors[field] = parsedMessage;
    }
    if (!firstError) {
      firstError = parsedMessage;
    }
  }

  return {
    success: false,
    error: firstError,
    fieldErrors,
  };
}

// ----------------------------------------------------
// 1. LOGIN VALIDATION SCHEMA
// ----------------------------------------------------
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, {
      message: JSON.stringify({
        tr: 'Kullanıcı adı alanı boş bırakılamaz.',
        en: 'Username cannot be empty.',
      }),
    })
    .min(3, {
      message: JSON.stringify({
        tr: 'Kullanıcı adı en az 3 karakter olmalıdır.',
        en: 'Username must be at least 3 characters long.',
      }),
    }),
  password: z
    .string()
    .min(1, {
      message: JSON.stringify({
        tr: 'Şifre alanı boş bırakılamaz.',
        en: 'Password cannot be empty.',
      }),
    })
    .min(6, {
      message: JSON.stringify({
        tr: 'Şifre en az 6 karakter olmalıdır.',
        en: 'Password must be at least 6 characters long.',
      }),
    }),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ----------------------------------------------------
// 2. REGISTER VALIDATION SCHEMA
// ----------------------------------------------------
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, {
        message: JSON.stringify({
          tr: 'Ad ve soyad alanı boş bırakılamaz.',
          en: 'Full name cannot be empty.',
        }),
      })
      .min(2, {
        message: JSON.stringify({
          tr: 'Ad ve soyad en az 2 karakter olmalıdır.',
          en: 'Full name must be at least 2 characters.',
        }),
      })
      .max(50, {
        message: JSON.stringify({
          tr: 'Ad ve soyad en fazla 50 karakter olabilir.',
          en: 'Full name must not exceed 50 characters.',
        }),
      }),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, {
        message: JSON.stringify({
          tr: 'Kullanıcı adı boş bırakılamaz.',
          en: 'Username cannot be empty.',
        }),
      })
      .min(3, {
        message: JSON.stringify({
          tr: 'Kullanıcı adı en az 3 karakter olmalıdır.',
          en: 'Username must be at least 3 characters.',
        }),
      })
      .max(30, {
        message: JSON.stringify({
          tr: 'Kullanıcı adı en fazla 30 karakter olabilir.',
          en: 'Username must not exceed 30 characters.',
        }),
      })
      .regex(/^[a-z0-9_.-]+$/, {
        message: JSON.stringify({
          tr: 'Kullanıcı adı sadece harf, rakam, alt tire ve nokta içerebilir.',
          en: 'Username can only contain letters, numbers, underscores, and dots.',
        }),
      }),
    password: z
      .string()
      .min(1, {
        message: JSON.stringify({
          tr: 'Şifre boş bırakılamaz.',
          en: 'Password cannot be empty.',
        }),
      })
      .min(6, {
        message: JSON.stringify({
          tr: 'Şifre en az 6 karakter olmalıdır.',
          en: 'Password must be at least 6 characters.',
        }),
      })
      .max(100, {
        message: JSON.stringify({
          tr: 'Şifre en fazla 100 karakter olabilir.',
          en: 'Password must not exceed 100 characters.',
        }),
      }),
    confirmPassword: z.string().min(1, {
      message: JSON.stringify({
        tr: 'Şifre tekrarı boş bırakılamaz.',
        en: 'Password confirmation cannot be empty.',
      }),
    }),
    avatar: z.string().min(1, {
      message: JSON.stringify({
        tr: 'Lütfen bir emoji avatarı seçin.',
        en: 'Please select an emoji avatar.',
      }),
    }),
    color: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: JSON.stringify({
      tr: 'Şifreler birbiriyle eşleşmiyor.',
      en: 'Passwords do not match.',
    }),
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ----------------------------------------------------
// 3. PROFILE UPDATE VALIDATION SCHEMA
// ----------------------------------------------------
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      message: JSON.stringify({
        tr: 'Görünen ad boş bırakılamaz.',
        en: 'Display name cannot be empty.',
      }),
    })
    .min(2, {
      message: JSON.stringify({
        tr: 'Görünen ad en az 2 karakter olmalıdır.',
        en: 'Display name must be at least 2 characters.',
      }),
    }),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, {
      message: JSON.stringify({
        tr: 'Kullanıcı adı boş bırakılamaz.',
        en: 'Username cannot be empty.',
      }),
    })
    .min(3, {
      message: JSON.stringify({
        tr: 'Kullanıcı adı en az 3 karakter olmalıdır.',
        en: 'Username must be at least 3 characters.',
      }),
    })
    .regex(/^[a-z0-9_.-]+$/, {
      message: JSON.stringify({
        tr: 'Kullanıcı adı sadece harf, rakam, alt tire ve nokta içerebilir.',
        en: 'Username can only contain letters, numbers, underscores, and dots.',
      }),
    }),
  avatar: z.string().min(1, {
    message: JSON.stringify({
      tr: 'Lütfen bir emoji avatarı seçin.',
      en: 'Please select an emoji avatar.',
    }),
  }),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ----------------------------------------------------
// 4. CHANGE PASSWORD VALIDATION SCHEMA
// ----------------------------------------------------
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, {
      message: JSON.stringify({
        tr: 'Mevcut (eski) şifre boş bırakılamaz.',
        en: 'Current password cannot be empty.',
      }),
    }),
    newPassword: z
      .string()
      .min(1, {
        message: JSON.stringify({
          tr: 'Yeni şifre boş bırakılamaz.',
          en: 'New password cannot be empty.',
        }),
      })
      .min(6, {
        message: JSON.stringify({
          tr: 'Yeni şifre en az 6 karakter uzunluğunda olmalıdır.',
          en: 'New password must be at least 6 characters long.',
        }),
      })
      .max(100, {
        message: JSON.stringify({
          tr: 'Yeni şifre en fazla 100 karakter olabilir.',
          en: 'New password must not exceed 100 characters.',
        }),
      }),
    confirmPassword: z.string().min(1, {
      message: JSON.stringify({
        tr: 'Yeni şifre tekrarı boş bırakılamaz.',
        en: 'New password confirmation cannot be empty.',
      }),
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: JSON.stringify({
      tr: 'Yeni şifre ile şifre tekrarı eşleşmiyor.',
      en: 'New password and confirmation do not match.',
    }),
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: JSON.stringify({
      tr: 'Yeni şifreniz eski şifrenizle aynı olamaz.',
      en: 'New password cannot be the same as current password.',
    }),
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ----------------------------------------------------
// 5. CREATE LIST VALIDATION SCHEMA
// ----------------------------------------------------
export const createListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, {
      message: JSON.stringify({
        tr: 'Liste başlığı boş bırakılamaz.',
        en: 'List title cannot be empty.',
      }),
    })
    .min(2, {
      message: JSON.stringify({
        tr: 'Liste başlığı en az 2 karakter olmalıdır.',
        en: 'List title must be at least 2 characters.',
      }),
    })
    .max(80, {
      message: JSON.stringify({
        tr: 'Liste başlığı en fazla 80 karakter olabilir.',
        en: 'List title must not exceed 80 characters.',
      }),
    }),
  description: z.string().trim().max(250, {
    message: JSON.stringify({
      tr: 'Açıklama en fazla 250 karakter olabilir.',
      en: 'Description must not exceed 250 characters.',
    }),
  }).optional(),
  type: z.enum(['SHOPPING', 'TODO', 'NOTE'], {
    message: JSON.stringify({
      tr: 'Geçersiz liste türü seçildi.',
      en: 'Invalid list type selected.',
    }),
  }),
  color: z.string().min(1, {
    message: JSON.stringify({
      tr: 'Lütfen bir tema rengi seçin.',
      en: 'Please select a theme color.',
    }),
  }),
  icon: z.string().optional(),
  isShared: z.boolean().optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;

// ----------------------------------------------------
// 6. INVITE USER VALIDATION SCHEMA
// ----------------------------------------------------
export const inviteUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, {
      message: JSON.stringify({
        tr: 'Kullanıcı adı veya e-posta girilmelidir.',
        en: 'Username or email must be provided.',
      }),
    })
    .min(2, {
      message: JSON.stringify({
        tr: 'Davet edilecek kullanıcı adı en az 2 karakter olmalıdır.',
        en: 'Target username must be at least 2 characters.',
      }),
    }),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
