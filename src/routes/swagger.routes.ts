/* eslint-disable sonarjs/no-duplicate-string */
import { Router } from 'express'

const openApiUnauthorizedRef = {
  $ref: '#/components/responses/Unauthorized',
} as const

const openApiForbiddenRef = {
  $ref: '#/components/responses/Forbidden',
} as const

const openApiTicketNotFoundRef = {
  description: 'Ticket not found',
} as const

const openApiContactSubmissionNotFoundRef = {
  description: 'Contact submission not found',
} as const

const openApiUserNotFoundRef = {
  description: 'User not found',
} as const

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'mojoSim API',
    version: '1.0.0',
    description:
      'Swagger docs for available endpoints (auth implemented in this phase).',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth' },
    { name: 'Profile' },
    { name: 'Catalog' },
    { name: 'Cart' },
    { name: 'Orders' },
    { name: 'eSIMs' },
    { name: 'Admin eSIMs' },
    { name: 'Providers' },
    { name: 'Plans' },
    { name: 'Content' },
    { name: 'Contact' },
    { name: 'Users' },
    { name: 'Support' },
    { name: 'Notifications' },
    { name: 'Reports' },
    { name: 'Provisioning' },
    { name: 'Webhooks' },
    { name: 'Audit logs' },
    { name: 'Admin auth' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
        description:
          'Deprecated single-session cookie. Prefer refresh_token_customer or refresh_token_staff.',
      },
      refreshTokenCustomerCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token_customer',
        description:
          'Customer refresh session (httpOnly). Set by POST /auth/login when role is customer.',
      },
      refreshTokenStaffCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token_staff',
        description:
          'Staff refresh session (httpOnly). Set by POST /auth/login when role is manager or admin.',
      },
    },
    responses: {
      ValidationError: {
        description: 'Request body failed validation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'VALIDATION_ERROR' },
                    message: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Missing or invalid auth token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'UNAUTHORIZED' },
                    message: { type: 'string', example: 'Unauthorized' },
                  },
                },
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Valid token but insufficient role',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'FORBIDDEN' },
                    message: { type: 'string', example: 'Forbidden' },
                  },
                },
              },
            },
          },
        },
      },
      Conflict: {
        description: 'Duplicate — e.g. email already registered',
      },
    },
    schemas: {
      AuthSuccessMessage: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      LoginSuccess: {
        type: 'object',
        properties: {
          access_token: { type: 'string', example: 'eyJ...' },
          expires_in: { type: 'number', example: 900 },
        },
      },
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          meta: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      CustomerOrderItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          plan_id: { type: 'integer' },
          cart_id: { type: 'integer', nullable: true },
          idempotency_key: { type: 'string' },
          order_type: {
            type: 'string',
            enum: ['new', 'renewal', 'topup'],
          },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'failed', 'refunded', 'cancelled'],
          },
          amount: { type: 'string' },
          currency: { type: 'string' },
          payment_gateway: { type: 'string' },
          payment_ref: { type: 'string', nullable: true },
          stripe_checkout_session_id: { type: 'string', nullable: true },
          checkout_expires_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          stripe_charge_id: { type: 'string', nullable: true },
          stripe_receipt_url: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          payment_status: {
            type: 'string',
            enum: ['pending', 'paid', 'failed', 'refunded'],
          },
          esim_status: {
            type: 'string',
            nullable: true,
            enum: ['queued', 'processing', 'success', 'failed', 'dead'],
            description:
              'Latest provisioning job status for the order. Null when no job exists yet.',
          },
          billing_snapshot: { type: 'object' },
          plan: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              data_label: { type: 'string', nullable: true },
              validity_days: { type: 'integer' },
              plan_type: {
                type: 'string',
                enum: ['local', 'regional', 'global'],
              },
              flag_url: { type: 'string', nullable: true },
              region_name: { type: 'string', nullable: true },
            },
          },
          refund_request: {
            type: 'object',
            nullable: true,
            properties: {
              status: {
                type: 'string',
                enum: [
                  'airalo_queued',
                  'airalo_pending',
                  'airalo_approved',
                  'airalo_rejected',
                  'stripe_refunded',
                  'cancelled',
                ],
              },
              requested_at: { type: 'string', format: 'date-time' },
              airalo_approved_at: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              stripe_refunded_at: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      OrderTimelineStep: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
          label: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['completed', 'failed'] },
          description: { type: 'string', nullable: true },
        },
        required: ['id', 'key', 'label', 'timestamp', 'status'],
      },
      LinkedEsimSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          iccid: { type: 'string' },
          lifecycle_state: {
            type: 'string',
            enum: [
              'created',
              'assigned',
              'activated',
              'suspended',
              'expired',
              'deactivated',
            ],
          },
          activated_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          expires_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          created_at: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'iccid', 'lifecycle_state', 'created_at'],
      },
      CustomerOrderDetail: {
        allOf: [
          { $ref: '#/components/schemas/CustomerOrderItem' },
          {
            type: 'object',
            properties: {
              timeline: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrderTimelineStep' },
              },
              linked_esim: {
                oneOf: [
                  { $ref: '#/components/schemas/LinkedEsimSummary' },
                  { type: 'null' },
                ],
              },
            },
            required: ['timeline', 'linked_esim'],
          },
        ],
      },
      AdminProvider: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          api_base_url: { type: 'string', format: 'uri' },
          is_active: { type: 'boolean' },
          priority: { type: 'integer', minimum: 0 },
          margin_percent: { type: 'string' },
          capabilities: {
            type: 'object',
            properties: {
              webhooks: { type: 'boolean' },
              topup: { type: 'boolean' },
              renewal: { type: 'boolean' },
              usage_api: { type: 'boolean' },
            },
          },
          api_credentials_configured: {
            type: 'boolean',
            description:
              'True when a non-empty encrypted credential payload exists in the database. Client secrets are never returned.',
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      AdminProviderDataEnvelope: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/AdminProvider' },
        },
      },
      AdminProvidersListEnvelope: {
        type: 'object',
        required: ['success', 'data', 'meta'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/AdminProvider' },
          },
          meta: {
            type: 'object',
            required: ['page', 'limit', 'total'],
            properties: {
              page: { type: 'integer', minimum: 1 },
              limit: { type: 'integer', minimum: 1 },
              total: { type: 'integer', minimum: 0 },
            },
          },
        },
      },
      AdminProviderToggleEnvelope: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['message', 'is_active'],
            properties: {
              message: { type: 'string' },
              is_active: { type: 'boolean' },
            },
          },
        },
      },
      AdminOrderListItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              email: { type: 'string', format: 'email' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
            },
          },
          plan: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
          },
          order_type: { type: 'string', enum: ['new', 'renewal', 'topup'] },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'failed', 'refunded', 'cancelled'],
          },
          payment_status: {
            type: 'string',
            enum: ['pending', 'paid', 'failed', 'refunded'],
          },
          amount: { type: 'string' },
          currency: { type: 'string' },
          payment_ref: { type: 'string', nullable: true },
          stripe_charge_id: { type: 'string', nullable: true },
          stripe_receipt_url: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AdminLineItem: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'string' },
          currency: { type: 'string' },
          flag_url: { type: 'string', nullable: true },
          destination_label: { type: 'string', nullable: true },
        },
      },
      AdminOrderDetail: {
        allOf: [
          { $ref: '#/components/schemas/AdminOrderListItem' },
          {
            type: 'object',
            properties: {
              plan: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  data_mb: { type: 'integer' },
                  data_label: { type: 'string', nullable: true },
                },
              },
              billing_snapshot: { type: 'object' },
              line_items: {
                type: 'array',
                items: { $ref: '#/components/schemas/AdminLineItem' },
              },
              events: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    action: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
              provisioning_job: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'integer' },
                  status: { type: 'string' },
                  attempt_count: { type: 'integer' },
                },
              },
              invoice: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'integer' },
                  invoice_number: { type: 'string' },
                },
              },
              esim_profiles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    iccid: { type: 'string' },
                    lifecycle_state: { type: 'string' },
                  },
                },
              },
            },
          },
        ],
      },
      EsimUsageSnapshot: {
        type: 'object',
        properties: {
          data_used_mb: { type: 'integer' },
          data_remaining_mb: { type: 'integer' },
          is_unlimited: { type: 'boolean' },
          recorded_at: { type: 'string', format: 'date-time' },
        },
      },
      EsimUsageRecordItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          data_used_mb: { type: 'integer' },
          data_remaining_mb: { type: 'integer' },
          is_unlimited: { type: 'boolean' },
          source: {
            type: 'string',
            description: 'Snapshot source, e.g. poll, webhook, manual',
          },
          recorded_at: { type: 'string', format: 'date-time' },
        },
      },
      EsimListItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          iccid: { type: 'string' },
          plan_name: { type: 'string' },
          data_mb: { type: 'integer' },
          data_label: {
            type: 'string',
            nullable: true,
            description: 'Provider human-readable data allowance, e.g. 5 GB',
          },
          validity_days: { type: 'integer' },
          lifecycle_state: {
            type: 'string',
            enum: [
              'created',
              'assigned',
              'activated',
              'suspended',
              'expired',
              'deactivated',
            ],
          },
          activated_at: { type: 'string', format: 'date-time', nullable: true },
          expires_at: { type: 'string', format: 'date-time', nullable: true },
          install_instructions: { type: 'string' },
          latest_usage: {
            oneOf: [
              { $ref: '#/components/schemas/EsimUsageSnapshot' },
              { type: 'null' },
            ],
          },
          order_id: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      EsimQrResponse: {
        type: 'object',
        properties: {
          qr_payload: {
            type: 'string',
            description: 'Raw LPA string for eSIM installation',
          },
          direct_apple_installation_url: {
            type: 'string',
            nullable: true,
          },
          install_instructions: { type: 'string' },
        },
        required: ['qr_payload', 'install_instructions'],
      },
      EsimTopupPackage: {
        type: 'object',
        properties: {
          package_id: { type: 'string' },
          title: { type: 'string' },
          data: { type: 'string' },
          data_mb: { type: 'integer' },
          validity_days: { type: 'integer' },
          price: { type: 'number' },
          currency: { type: 'string' },
          is_unlimited: { type: 'boolean' },
          voice: { type: 'integer', nullable: true },
          text: { type: 'integer', nullable: true },
        },
      },
      EsimTopupInitiateBody: {
        type: 'object',
        required: ['package_id', 'idempotency_key'],
        properties: {
          package_id: { type: 'string' },
          idempotency_key: { type: 'string' },
          currency: { type: 'string', default: 'USD' },
        },
      },
      EsimRenewalInitiateBody: {
        type: 'object',
        required: ['package_id', 'idempotency_key'],
        properties: {
          package_id: { type: 'string', description: 'Plan provider_sku' },
          idempotency_key: { type: 'string' },
          currency: { type: 'string', default: 'USD' },
        },
      },
      EsimRenewalHistoryRow: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          renewal_type: { type: 'string', enum: ['renewal', 'topup'] },
          status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] },
          previous_expires_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          new_expires_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          order: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              amount: { type: 'string' },
              status: { type: 'string' },
            },
          },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/webhooks/stripe': {
      post: {
        tags: ['Webhooks'],
        summary: 'Receive Stripe payment webhooks',
        responses: {
          200: { description: 'Webhook accepted' },
          400: { description: 'Invalid webhook signature/payload' },
        },
      },
    },
    '/webhooks/airalo': {
      post: {
        tags: ['Webhooks'],
        summary: 'Receive Airalo provider webhooks',
        responses: {
          200: { description: 'Webhook accepted' },
          400: { description: 'Invalid webhook signature/payload' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'first_name', 'last_name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8, maxLength: 128 },
                  first_name: { type: 'string', minLength: 1, maxLength: 100 },
                  last_name: { type: 'string', minLength: 1, maxLength: 100 },
                  locale: { type: 'string', minLength: 2, maxLength: 10 },
                  currency: {
                    type: 'string',
                    pattern: '^[A-Z]{3}$',
                    example: 'USD',
                  },
                  phone: {
                    type: 'string',
                    example: '+971501234567',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Verification email sent' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email using token from email link',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: { token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email verified' },
        },
      },
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Re-send email verification link',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Verification email re-sent' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary:
          'Staff login (manager/admin password). Customer password login is deprecated — use OTP endpoints.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'Logged in. Sets refresh_token_customer (customer) or refresh_token_staff (manager/admin); clears other refresh cookies.',
          },
        },
      },
    },
    '/auth/otp/request': {
      post: {
        tags: ['Auth'],
        summary: 'Request a one-time login code for customer accounts',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP email sent (or generic success message)' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify OTP and create customer session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  code: { type: 'string', minLength: 6, maxLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'Logged in. Sets refresh_token_customer and returns access token.',
          },
          401: { description: 'Invalid or expired code' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary:
          'Customer logout (requires Bearer customer + refresh_token_customer or legacy refresh_token)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'refresh_token_customer',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'refresh_token',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
            description: 'Legacy cookie; migrated on refresh.',
          },
        ],
        responses: {
          200: { description: 'Logged out' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary:
          'Refresh customer access token (refresh_token_customer or legacy refresh_token; rejects staff sessions)',
        security: [{ refreshTokenCustomerCookie: [] }],
        parameters: [
          {
            name: 'refresh_token_customer',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'refresh_token',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Access token refreshed' },
          401: openApiUnauthorizedRef,
        },
      },
    },
    '/admin/auth/refresh': {
      post: {
        tags: ['Admin auth'],
        summary:
          'Refresh staff access token (refresh_token_staff or legacy refresh_token; rejects customer sessions)',
        security: [{ refreshTokenStaffCookie: [] }],
        parameters: [
          {
            name: 'refresh_token_staff',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'refresh_token',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Access token refreshed' },
          401: openApiUnauthorizedRef,
        },
      },
    },
    '/admin/auth/logout': {
      post: {
        tags: ['Admin auth'],
        summary:
          'Staff logout (requires Bearer manager/admin + refresh_token_staff or legacy refresh_token)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'refresh_token_staff',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'refresh_token',
            in: 'cookie',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Logged out' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Send password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset email sent' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using token from email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
        },
      },
    },
    '/auth/reset-password/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify reset/invite token validity',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token validity result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        valid: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/plans': {
      get: {
        tags: ['Catalog'],
        summary: 'List active plans (paginated, public)',
        description:
          'Public price field reflects internally calculated selling_price (not provider wholesale/net values). Includes coverage by country and network types when provided by Airalo.',
        parameters: [
          {
            name: 'country_code',
            in: 'query',
            schema: { type: 'string', minLength: 2, maxLength: 16 },
          },
          { name: 'region', in: 'query', schema: { type: 'string' } },
          {
            name: 'plan_type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['local', 'regional', 'global'],
            },
          },
          {
            name: 'airalo_package_type',
            in: 'query',
            description: 'Airalo package.type from catalog (e.g. sim, topup)',
            schema: { type: 'string', minLength: 1, maxLength: 20 },
          },
          {
            name: 'is_featured',
            in: 'query',
            schema: { type: 'string', enum: ['true', 'false'] },
          },
          {
            name: 'provider_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'data',
            in: 'query',
            schema: {
              type: 'string',
              examples: ['unlimited', '2gb', '3gb', '500mb'],
            },
            description:
              'Filter by data allowance. Use unlimited, or a value like 2gb / 500mb.',
          },
          {
            name: 'validity_days',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 3650 },
            description: 'Filter by plan validity in days (e.g. 7, 15, 30).',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Plans array and pagination meta',
          },
        },
      },
    },
    '/plans/search': {
      get: {
        tags: ['Catalog'],
        summary: 'Search plans by country name or code (public)',
        description: 'Returned price is selling_price shown to customers.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 1 },
          },
        ],
        responses: {
          200: { description: 'Matching active plans' },
        },
      },
    },
    '/plans/featured': {
      get: {
        tags: ['Catalog'],
        summary: 'Featured active plans (public)',
        description: 'Returned price is selling_price shown to customers.',
        parameters: [
          {
            name: 'validity_days',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 3650 },
            description: 'Filter by plan validity in days (e.g. 7, 15, 30).',
          },
        ],
        responses: {
          200: { description: 'Featured plans' },
        },
      },
    },
    '/plans/destinations': {
      get: {
        tags: ['Catalog'],
        summary:
          'Distinct countries and plan-level regions for active plans (public)',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string', minLength: 1, maxLength: 200 },
            description:
              'Optional search by country code/name or region name. Disabled destinations are excluded.',
          },
        ],
        responses: {
          200: {
            description:
              '{ countries: [{ country_code, country_name }], regions: string[] }',
          },
        },
      },
    },
    '/plans/destinations/available': {
      get: {
        tags: ['Catalog'],
        summary:
          'Available destinations grouped by local, regional, and global plans (public)',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string', minLength: 1, maxLength: 200 },
            description:
              'Optional search. Matches local by country code/name and regional/global by region name. Disabled destinations are excluded.',
          },
        ],
        responses: {
          200: {
            description:
              '{ local: [{ country_code, country_name, flag_url }], regional: [{ region_name, flag_url }], global: [{ region_name, flag_url }] }',
          },
        },
      },
    },
    '/plans/{id}': {
      get: {
        tags: ['Catalog'],
        summary: 'Plan detail (public)',
        description: 'Returned price is selling_price shown to customers.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Plan with provider' },
          404: { description: 'Plan not found or inactive' },
        },
      },
    },
    '/plans/{id}/destinations': {
      get: {
        tags: ['Catalog'],
        summary: 'Plan destinations by id (public)',
        description:
          'Returns destination countries for the selected active plan. Disabled destinations are excluded.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'germ' },
            description: 'Optional search by country code or country name.',
          },
        ],
        responses: {
          200: { description: 'Plan destinations list' },
          404: { description: 'Plan not found or inactive' },
        },
      },
    },
    '/plans/{id}/coverage': {
      get: {
        tags: ['Catalog'],
        summary: 'Plan coverage by id (public)',
        description:
          'Returns coverage array for the selected active plan as a dedicated response.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Plan coverage list' },
          404: { description: 'Plan not found or inactive' },
        },
      },
    },
    '/plans/{id}/package-details': {
      get: {
        tags: ['Catalog'],
        summary: 'Plan package detail sections (public)',
        description:
          'Returns provider activation, validity, IP routing, and top-up detail blocks derived from synced Airalo metadata.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Package detail sections',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        provider_activation_policy: {
                          type: 'object',
                          properties: {
                            activation_policy: {
                              type: 'string',
                              nullable: true,
                              example: 'first-usage',
                            },
                            install_window_days: {
                              type: 'integer',
                              nullable: true,
                              example: 365,
                            },
                            description: { type: 'string' },
                          },
                        },
                        validity_policy: {
                          type: 'object',
                          properties: {
                            activation_policy: {
                              type: 'string',
                              nullable: true,
                              example: 'first-usage',
                            },
                            validity_days: { type: 'integer', example: 30 },
                            description: { type: 'string' },
                          },
                        },
                        ip_routing: {
                          type: 'object',
                          properties: {
                            is_roaming: {
                              type: 'boolean',
                              nullable: true,
                              example: true,
                            },
                            note: {
                              type: 'string',
                              nullable: true,
                            },
                            description: { type: 'string' },
                          },
                        },
                        top_up_option: {
                          type: 'object',
                          properties: {
                            rechargeability: {
                              type: 'boolean',
                              nullable: true,
                              example: true,
                            },
                            topup_grace_window_days: {
                              type: 'integer',
                              nullable: true,
                              example: 180,
                            },
                            description: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Plan not found or inactive' },
        },
      },
    },
    '/cart': {
      post: {
        tags: ['Cart'],
        summary: 'Create active cart and add first item',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan_id'],
                properties: {
                  plan_id: { type: 'integer', minimum: 1 },
                  quantity: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 20,
                    default: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cart created or existing active cart returned' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan not found' },
        },
      },
      get: {
        tags: ['Cart'],
        summary: 'Get current active cart',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Active cart, or message if no active cart exists',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Abandon current active cart',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Cart abandoned' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Cart not found' },
        },
      },
    },
    '/cart/item': {
      put: {
        tags: ['Cart'],
        summary: 'Replace current cart item with another plan',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan_id'],
                properties: {
                  plan_id: { type: 'integer', minimum: 1 },
                  quantity: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 20,
                    default: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cart item replaced' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Cart or plan not found' },
        },
      },
    },
    '/guest/cart': {
      post: {
        tags: ['Cart'],
        summary:
          'Create guest cart and add first item (sets guest_cart_token cookie)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan_id'],
                properties: {
                  plan_id: { type: 'integer', minimum: 1 },
                  quantity: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 20,
                    default: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Guest cart created' },
        },
      },
      get: {
        tags: ['Cart'],
        summary: 'Get guest cart (empty cart if no guest_cart_token cookie)',
        responses: {
          200: { description: 'Guest cart or empty cart payload' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Abandon guest cart and clear guest_cart_token cookie',
        responses: {
          200: { description: 'Guest cart abandoned' },
          401: { description: 'Missing guest cart cookie' },
        },
      },
    },
    '/guest/cart/item': {
      put: {
        tags: ['Cart'],
        summary: 'Replace guest cart item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan_id'],
                properties: {
                  plan_id: { type: 'integer', minimum: 1 },
                  quantity: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 20,
                    default: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Guest cart item replaced' },
          401: { description: 'Missing guest cart cookie' },
        },
      },
    },
    '/checkout/identify': {
      post: {
        tags: ['Cart'],
        summary:
          'Find or create customer from checkout contact details, merge guest cart, issue session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'first_name', 'last_name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  first_name: { type: 'string', minLength: 1, maxLength: 100 },
                  last_name: { type: 'string', minLength: 1, maxLength: 100 },
                  phone: {
                    type: 'string',
                    nullable: true,
                  },
                  locale: { type: 'string', minLength: 2, maxLength: 10 },
                  currency: {
                    type: 'string',
                    pattern: '^[A-Z]{3}$',
                    example: 'USD',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'Customer identified. Returns access token, user, and merged cart.',
          },
        },
      },
    },
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create order and Stripe PaymentIntent',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cart_id', 'idempotency_key'],
                properties: {
                  cart_id: { type: 'integer', minimum: 1 },
                  idempotency_key: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Order created (or existing by idempotency key)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        order: {
                          $ref: '#/components/schemas/CustomerOrderItem',
                        },
                        client_secret: {
                          type: 'string',
                          nullable: true,
                          description:
                            'Stripe PaymentIntent client secret for on-site card payment',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan or cart not found' },
        },
      },
      get: {
        tags: ['Orders'],
        summary: 'List customer orders (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['pending', 'confirmed', 'failed', 'refunded', 'cancelled'],
            },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Filtered orders with status counts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/CustomerOrderItem' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        counts: {
                          type: 'object',
                          properties: {
                            all: { type: 'integer' },
                            pending: { type: 'integer' },
                            confirmed: { type: 'integer' },
                            failed: { type: 'integer' },
                            refunded: { type: 'integer' },
                            cancelled: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get single customer order by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Order details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/CustomerOrderDetail' },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/status': {
      get: {
        tags: ['Orders'],
        summary: 'Get customer order payment status by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Order payment status details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        order: {
                          $ref: '#/components/schemas/CustomerOrderItem',
                        },
                        client_secret: {
                          type: 'string',
                          nullable: true,
                          description:
                            'Stripe PaymentIntent client secret for on-site card payment',
                        },
                        can_retry_payment: {
                          type: 'boolean',
                          example: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/payment-intent': {
      post: {
        tags: ['Orders'],
        summary: 'Refresh Stripe PaymentIntent for a pending order',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'PaymentIntent returned or refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        order: {
                          $ref: '#/components/schemas/CustomerOrderItem',
                        },
                        client_secret: {
                          type: 'string',
                          nullable: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order not found' },
          409: { description: 'Only pending orders can refresh payment' },
        },
      },
    },
    '/esims': {
      get: {
        tags: ['eSIMs'],
        summary: 'List eSIM profiles for the authenticated customer',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'lifecycle_state',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'created',
                'assigned',
                'activated',
                'suspended',
                'expired',
                'deactivated',
              ],
            },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Filter by plan name or ICCID (case-insensitive)',
            schema: { type: 'string', maxLength: 100 },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        ],
        responses: {
          200: {
            description: 'Filtered eSIM profiles with lifecycle counts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/EsimListItem' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        counts: {
                          type: 'object',
                          properties: {
                            all: { type: 'integer' },
                            created: { type: 'integer' },
                            assigned: { type: 'integer' },
                            activated: { type: 'integer' },
                            suspended: { type: 'integer' },
                            expired: { type: 'integer' },
                            deactivated: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/esims/{id}/qr': {
      get: {
        tags: ['eSIMs'],
        summary: 'Get decrypted QR / LPA payload for installation (owner only)',
        description:
          'Returns the LPA string decrypted in memory for this request only.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'QR payload and install instructions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/EsimQrResponse' },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
        },
      },
    },
    '/esims/{id}/topup-packages': {
      get: {
        tags: ['eSIMs'],
        summary: 'List available top-up packages for an eSIM (activated only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Top-up packages from provider',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/EsimTopupPackage' },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
          422: { description: 'eSIM not active' },
        },
      },
    },
    '/esims/{id}/topup': {
      post: {
        tags: ['eSIMs'],
        summary: 'Start top-up checkout (Stripe PaymentIntent)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EsimTopupInitiateBody' },
            },
          },
        },
        responses: {
          201: {
            description:
              'Order created; client_secret null if idempotent replay',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        order_id: { type: 'integer' },
                        client_secret: { type: 'string', nullable: true },
                        amount: { type: 'string' },
                        currency: { type: 'string' },
                        package: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM or plan not found' },
          409: { description: 'Idempotency conflict' },
          422: { description: 'Validation error' },
        },
      },
    },
    '/esims/{id}/renew': {
      post: {
        tags: ['eSIMs'],
        summary: 'Start renewal checkout (same SIM, new plan order)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EsimRenewalInitiateBody' },
            },
          },
        },
        responses: {
          201: {
            description:
              'Order created; client_secret null if idempotent replay',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        order_id: { type: 'integer' },
                        client_secret: { type: 'string', nullable: true },
                        amount: { type: 'string' },
                        currency: { type: 'string' },
                        plan: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM or plan not found' },
          409: { description: 'Idempotency conflict' },
          422: { description: 'Validation error' },
        },
      },
    },
    '/esims/{id}/renewals': {
      get: {
        tags: ['eSIMs'],
        summary: 'Renewal and top-up history for an eSIM',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Paginated renewal and top-up rows with linked order',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/EsimRenewalHistoryRow',
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
        },
      },
    },
    '/esims/{id}/usage-records': {
      get: {
        tags: ['eSIMs'],
        summary: 'Usage snapshot history for an eSIM',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        ],
        responses: {
          200: {
            description: 'Paginated usage_records rows newest first',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/EsimUsageRecordItem',
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
        },
      },
    },
    '/esims/{id}/refresh-usage': {
      post: {
        tags: ['eSIMs'],
        summary: 'Queue on-demand usage sync from provider',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          202: {
            description: 'Usage sync job queued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        queued: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
          422: { description: 'eSIM deactivated' },
          503: { description: 'Queue unavailable' },
        },
      },
    },
    '/esims/{id}': {
      get: {
        tags: ['eSIMs'],
        summary: 'Get one eSIM profile by id (owner only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'eSIM details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/EsimListItem' },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
        },
      },
    },
    '/invoices': {
      get: {
        tags: ['Orders'],
        summary: 'List invoices for the authenticated customer',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        ],
        responses: {
          200: { description: 'Paginated invoice list' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/orders/{id}/invoice': {
      get: {
        tags: ['Orders'],
        summary: 'Get invoice by order id (customer)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Invoice details' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order or invoice not found' },
        },
      },
    },
    '/orders/{id}/invoice/download': {
      get: {
        tags: ['Orders'],
        summary: 'Download invoice PDF (customer)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Invoice PDF file',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order, invoice, or PDF not ready' },
        },
      },
    },
    '/admin/esims/failed-activations': {
      get: {
        tags: ['Admin eSIMs'],
        summary:
          'Failed provisioning jobs and failed top-up/renewal fulfillments (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'provisioning_limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
          },
          {
            name: 'fulfillment_limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
          },
        ],
        responses: {
          200: {
            description: 'provisioning_failed and topup_renewal_failed lists',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/renewals/{id}/retry': {
      post: {
        tags: ['Admin eSIMs'],
        summary:
          'Retry failed or pending top-up/renewal fulfillment (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Fulfillment retry completed' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Renewal not found' },
          409: { description: 'Renewal already confirmed' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/orders/{id}/retry-fulfillment': {
      post: {
        tags: ['Admin Orders'],
        summary:
          'Retry top-up/renewal fulfillment for orders without a renewal row (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Fulfillment retry completed' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order not found' },
          409: { description: 'Renewal already confirmed' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/esims': {
      get: {
        tags: ['Admin eSIMs'],
        summary: 'List eSIM profiles with filters (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'user_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'order_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'lifecycle_state',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'created',
                'assigned',
                'activated',
                'suspended',
                'expired',
                'deactivated',
              ],
            },
          },
          { name: 'iccid', in: 'query', schema: { type: 'string' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Paginated eSIM list' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/esims/{id}/history': {
      get: {
        tags: ['Admin eSIMs'],
        summary: 'Full lifecycle status history (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
          },
        ],
        responses: {
          200: { description: 'Paginated history' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
        },
      },
    },
    '/admin/esims/{id}/deactivate': {
      patch: {
        tags: ['Admin eSIMs'],
        summary: 'Manually deactivate an eSIM (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', maxLength: 500, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Deactivated or already deactivated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
        },
      },
    },
    '/admin/esims/{id}/reissue': {
      post: {
        tags: ['Admin eSIMs'],
        summary: 'Create replacement eSIM provisioning job (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', maxLength: 500, nullable: true },
                  ticket_id: { type: 'integer', minimum: 1, nullable: true },
                  deactivate_old_profile: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'Replacement order and provisioning job created; old profile optionally deactivated',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM or source order not found' },
        },
      },
    },
    '/admin/esims/{id}': {
      get: {
        tags: ['Admin eSIMs'],
        summary:
          'Full eSIM details including recent status history (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'eSIM detail payload' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'eSIM not found' },
        },
      },
    },
    '/admin/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['pending', 'confirmed', 'failed', 'refunded', 'cancelled'],
            },
          },
          {
            name: 'payment_status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
            },
          },
          {
            name: 'order_type',
            in: 'query',
            schema: { type: 'string', enum: ['new', 'renewal', 'topup'] },
          },
          {
            name: 'user_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Orders list and pagination meta',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/AdminOrderListItem',
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order details (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Order details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AdminOrderDetail' },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order not found' },
        },
      },
    },
    '/admin/orders/{id}/refund': {
      post: {
        tags: ['Orders'],
        summary: 'Refund order (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', minLength: 1, maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order refunded' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Order not found' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/support/tickets': {
      post: {
        tags: ['Support'],
        summary:
          'Create support ticket with first message (customer). Priority defaults to normal.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                  subject: { type: 'string', minLength: 1, maxLength: 255 },
                  message: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 4000,
                    description: 'First ticket message (public)',
                  },
                  esim_profile_id: {
                    type: 'integer',
                    minimum: 1,
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Support ticket created' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      get: {
        tags: ['Support'],
        summary: 'List my support tickets (customer)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Support tickets array and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/support/tickets/assigned': {
      get: {
        tags: ['Support'],
        summary:
          'List support tickets for staff (admin: all with filters; manager: assigned to self)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['open', 'in_progress', 'resolved', 'closed'],
            },
          },
          {
            name: 'priority',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
            },
          },
          {
            name: 'assigned_to',
            in: 'query',
            required: false,
            description: 'Admin only — filter by assignee user id',
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Support tickets array and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/support/tickets/{id}': {
      get: {
        tags: ['Support'],
        summary: 'Get ticket with messages (customer; internal notes excluded)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Ticket and messages' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiTicketNotFoundRef,
        },
      },
    },
    '/support/tickets/{id}/close': {
      patch: {
        tags: ['Support'],
        summary: 'Close a resolved ticket (customer)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Ticket closed' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiTicketNotFoundRef,
          422: {
            description: 'Only resolved tickets can be closed',
          },
        },
      },
    },
    '/support/tickets/{id}/messages': {
      post: {
        tags: ['Support'],
        summary: 'Send follow-up message (customer)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['body'],
                properties: {
                  body: { type: 'string', minLength: 1, maxLength: 4000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Message sent' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiTicketNotFoundRef,
        },
      },
    },
    '/admin/support/tickets/{id}/messages': {
      post: {
        tags: ['Support'],
        summary:
          'Send ticket message (manager/admin). Use is_internal true for internal notes.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['body'],
                properties: {
                  body: { type: 'string', minLength: 1, maxLength: 4000 },
                  is_internal: {
                    type: 'boolean',
                    default: false,
                    description:
                      'false = public reply to customer (triggers notification); true = internal note',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Message or internal note created' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiTicketNotFoundRef,
        },
      },
    },
    '/admin/support/tickets': {
      get: {
        tags: ['Support'],
        summary: 'List all support tickets with filters (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['open', 'in_progress', 'resolved', 'closed'],
            },
          },
          {
            name: 'priority',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
            },
          },
          {
            name: 'assigned_to',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Support tickets array and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/support/tickets/{id}': {
      get: {
        tags: ['Support'],
        summary:
          'Get ticket with all messages (manager/admin; includes internal)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Ticket and messages (includes internal)' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiTicketNotFoundRef,
        },
      },
      patch: {
        tags: ['Support'],
        summary:
          'Partially update ticket (manager/admin). At least one of status, priority, or assigned_to required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  status: {
                    type: 'string',
                    enum: ['open', 'in_progress', 'resolved', 'closed'],
                    description:
                      'Setting resolved sets resolved_at; other statuses clear resolved_at',
                  },
                  priority: {
                    type: 'string',
                    enum: ['low', 'normal', 'high', 'urgent'],
                  },
                  assigned_to: {
                    type: 'integer',
                    minimum: 1,
                    nullable: true,
                    description:
                      'Assignee must be manager or admin; null to unassign',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Ticket updated' },
          400: {
            description:
              'Validation error (e.g. empty body or invalid assignee)',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiTicketNotFoundRef,
        },
      },
    },
    '/admin/providers': {
      get: {
        tags: ['Providers'],
        summary: 'List providers (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Providers list and pagination meta',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminProvidersListEnvelope',
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      post: {
        tags: ['Providers'],
        summary: 'Create provider (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug', 'api_base_url', 'api_credentials'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 255 },
                  slug: { type: 'string', minLength: 1, maxLength: 100 },
                  api_base_url: { type: 'string', format: 'uri' },
                  api_credentials: {
                    type: 'object',
                    required: ['client_id', 'client_secret'],
                    properties: {
                      client_id: { type: 'string', minLength: 1 },
                      client_secret: { type: 'string', minLength: 1 },
                      api_key: {
                        type: 'string',
                        minLength: 1,
                        description:
                          'Optional. Omit for OAuth-only providers (e.g. Airalo).',
                      },
                    },
                  },
                  priority: {
                    type: 'integer',
                    minimum: 0,
                    default: 0,
                  },
                  margin_percent: {
                    type: 'number',
                    minimum: 0,
                    maximum: 200,
                    default: 20,
                  },
                  capabilities: {
                    type: 'object',
                    properties: {
                      webhooks: { type: 'boolean', default: false },
                      topup: { type: 'boolean', default: false },
                      renewal: { type: 'boolean', default: false },
                      usage_api: { type: 'boolean', default: false },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Provider created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminProviderDataEnvelope',
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          409: { description: 'Provider slug already exists' },
        },
      },
    },
    '/admin/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhook events (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'source',
            in: 'query',
            schema: { type: 'string', enum: ['stripe', 'airalo'] },
          },
          {
            name: 'event_type',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'processed',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Webhook events list and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/webhooks/{id}': {
      get: {
        tags: ['Webhooks'],
        summary: 'Get webhook event by id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Webhook event details with raw payload' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Webhook event not found' },
        },
      },
    },
    '/admin/webhooks/{id}/retry': {
      post: {
        tags: ['Webhooks'],
        summary: 'Retry webhook event processing (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Webhook retry queued' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Webhook event not found' },
        },
      },
    },
    '/admin/audit-logs': {
      get: {
        tags: ['Audit logs'],
        summary: 'List audit logs (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'actor_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'action',
            in: 'query',
            schema: { type: 'string', maxLength: 200 },
          },
          {
            name: 'entity_type',
            in: 'query',
            schema: { type: 'string', maxLength: 100 },
          },
          {
            name: 'entity_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'created_from',
            in: 'query',
            description:
              'ISO 8601 date-time, inclusive lower bound on created_at',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'created_to',
            in: 'query',
            description:
              'ISO 8601 date-time, inclusive upper bound on created_at',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Audit log rows and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/audit-logs/{entity_type}/{entity_id}': {
      get: {
        tags: ['Audit logs'],
        summary: 'Audit trail for a specific entity (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'entity_type',
            in: 'path',
            required: true,
            description: 'Entity type string (e.g. orders, users)',
            schema: {
              type: 'string',
              pattern: '^[a-z0-9_-]+$',
              maxLength: 100,
            },
          },
          {
            name: 'entity_id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description:
              'Chronological audit entries for the entity (oldest first)',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/providers/{id}': {
      get: {
        tags: ['Providers'],
        summary: 'Get provider by id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Provider details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminProviderDataEnvelope',
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Provider not found' },
        },
      },
      patch: {
        tags: ['Providers'],
        summary: 'Update provider (admin). Slug is immutable after creation.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 255 },
                  api_base_url: { type: 'string', format: 'uri' },
                  api_credentials: {
                    type: 'object',
                    description:
                      'Omit to keep existing credentials. When provided, replaces the stored encrypted credential payload.',
                    properties: {
                      client_id: { type: 'string', minLength: 1 },
                      client_secret: { type: 'string', minLength: 1 },
                      api_key: {
                        type: 'string',
                        minLength: 1,
                        nullable: true,
                        description:
                          'Optional. Omit for OAuth-only providers (e.g. Airalo).',
                      },
                    },
                  },
                  priority: { type: 'integer', minimum: 0 },
                  margin_percent: {
                    type: 'number',
                    minimum: 0,
                    maximum: 200,
                  },
                  capabilities: {
                    type: 'object',
                    properties: {
                      webhooks: { type: 'boolean' },
                      topup: { type: 'boolean' },
                      renewal: { type: 'boolean' },
                      usage_api: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Provider updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminProviderDataEnvelope',
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Provider not found' },
          409: { description: 'Provider slug already exists' },
        },
      },
    },
    '/admin/providers/{id}/toggle': {
      patch: {
        tags: ['Providers'],
        summary: 'Toggle provider active state (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Provider activation toggled',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminProviderToggleEnvelope',
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Provider not found' },
        },
      },
    },
    '/admin/providers/{id}/airalo/webhooks/opt-in': {
      post: {
        tags: ['Providers'],
        summary:
          'Register Airalo webhook URL/types via notifications opt-in (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  webhook_url: {
                    type: 'string',
                    format: 'uri',
                    nullable: true,
                    description:
                      'Public URL Airalo will call. Defaults to APP_URL/api/v1/webhooks/airalo when omitted.',
                  },
                  types: {
                    type: 'array',
                    nullable: true,
                    items: { type: 'string' },
                    example: [
                      'async_orders',
                      'webhook_low_data',
                      'webhook_credit_limit',
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Opt-in registration completed' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Provider not found' },
          400: {
            description:
              'Unsupported provider or invalid webhook registration payload',
          },
        },
      },
    },
    '/admin/plans': {
      get: {
        tags: ['Plans'],
        summary: 'List plans (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'is_active',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'is_featured',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'provider_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'country_code',
            in: 'query',
            schema: { type: 'string', minLength: 2, maxLength: 16 },
          },
          { name: 'region', in: 'query', schema: { type: 'string' } },
          {
            name: 'plan_type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['local', 'regional', 'global'],
            },
          },
          {
            name: 'airalo_package_type',
            in: 'query',
            schema: { type: 'string', minLength: 1, maxLength: 20 },
          },
          {
            name: 'data',
            in: 'query',
            schema: {
              type: 'string',
              examples: ['unlimited', '2gb', '3gb', '500mb'],
            },
          },
          {
            name: 'validity_days',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 3650 },
            description: 'Filter by plan validity in days (e.g. 7, 15, 30).',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Plans list and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/plans/destinations': {
      get: {
        tags: ['Plans'],
        summary: 'List destination activation states (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string', minLength: 1, maxLength: 200 },
          },
        ],
        responses: {
          200: {
            description:
              'Grouped destinations by plan type with total_plans and is_active per item (is_active is null for regional/global)',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/plans/destinations/{country_code}': {
      patch: {
        tags: ['Plans'],
        summary: 'Enable or disable a destination (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'country_code',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 2, maxLength: 16 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['is_active'],
                properties: {
                  is_active: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Destination status updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Destination not found' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/plans/{id}/destinations': {
      get: {
        tags: ['Plans'],
        summary: 'Get plan destinations by id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Plan destinations list' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan not found' },
        },
      },
    },
    '/admin/plans/{id}/coverage': {
      get: {
        tags: ['Plans'],
        summary: 'Get plan coverage by id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Plan coverage list' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan not found' },
        },
      },
    },
    '/admin/plans/sync': {
      post: {
        tags: ['Plans'],
        summary: 'Sync plan catalog from provider (Airalo) (admin)',
        description:
          'Fetches Airalo eSIM packages (type sim only; top-up packages are not imported), upserts plans and destinations, deactivates SKUs no longer in the catalog.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  provider_id: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sync result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        provider: { type: 'string', example: 'Airalo' },
                        total: { type: 'integer', example: 150 },
                        inserted: { type: 'integer', example: 12 },
                        updated: { type: 'integer', example: 138 },
                        deactivated: { type: 'integer', example: 0 },
                        errors: { type: 'integer', example: 0 },
                        synced_at: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-04-01T10:00:00.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/compatibility/sync': {
      post: {
        tags: ['Providers'],
        summary:
          'Sync compatible device catalog from provider (Airalo) (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  provider_id: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Compatibility sync result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        provider: { type: 'string', example: 'Airalo' },
                        total: { type: 'integer', example: 1200 },
                        inserted: { type: 'integer', example: 40 },
                        updated: { type: 'integer', example: 1160 },
                        deactivated: { type: 'integer', example: 8 },
                        errors: { type: 'integer', example: 0 },
                        synced_at: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-04-17T09:30:00.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/compatible-devices': {
      get: {
        tags: ['Providers'],
        summary: 'List active compatible devices from synced provider catalog',
        parameters: [
          {
            name: 'provider_id',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'ios apple iphone 15' },
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Compatible devices list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          provider_id: { type: 'integer', example: 1 },
                          os: { type: 'string', example: 'ios' },
                          brand: { type: 'string', example: 'Apple' },
                          name: { type: 'string', example: 'iPhone 15 Pro' },
                          synced_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-04-17T09:30:00.000Z',
                          },
                        },
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 1200 },
                        provider_id: { type: 'integer', example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/plans/{id}': {
      get: {
        tags: ['Plans'],
        summary: 'Get plan by id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Plan details' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan not found' },
        },
      },
      patch: {
        tags: ['Plans'],
        summary: 'Update plan visibility (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  is_active: { type: 'boolean' },
                  is_featured: { type: 'boolean' },
                  custom_margin_percent: {
                    type: 'number',
                    minimum: 0,
                    maximum: 200,
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Plan updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan not found' },
        },
      },
    },
    '/admin/plans/recalculate': {
      post: {
        tags: ['Plans'],
        summary: 'Recalculate selling prices for all active providers (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Selling prices recalculated across providers' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/providers/{id}/recalculate': {
      post: {
        tags: ['Providers'],
        summary: 'Recalculate selling prices for one provider (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Selling prices recalculated for provider' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Provider not found' },
        },
      },
    },
    '/admin/plans/{id}/translations': {
      post: {
        tags: ['Plans'],
        summary: 'Upsert plan translation (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['locale', 'name', 'description'],
                properties: {
                  locale: { type: 'string', minLength: 2, maxLength: 10 },
                  name: { type: 'string', minLength: 1, maxLength: 255 },
                  description: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Translation upserted' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan not found' },
        },
      },
    },
    '/admin/plans/{id}/translations/{locale}': {
      delete: {
        tags: ['Plans'],
        summary: 'Delete plan translation (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'locale',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 2, maxLength: 10 },
          },
        ],
        responses: {
          200: { description: 'Translation deleted' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Plan or translation not found' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'role',
            in: 'query',
            schema: {
              oneOf: [
                { type: 'string', enum: ['customer', 'manager', 'admin'] },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['customer', 'manager', 'admin'],
                  },
                },
              ],
            },
            description:
              'Filter by one or more roles. Supports role=customer&role=manager or role=customer,manager.',
          },
          { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
          { name: 'email_verified', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Paginated users' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create manager/admin user invite (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['first_name', 'last_name', 'email', 'role'],
                properties: {
                  first_name: { type: 'string', minLength: 1, maxLength: 100 },
                  last_name: { type: 'string', minLength: 1, maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['manager', 'admin'] },
                  locale: { type: 'string', default: 'en' },
                  currency: { type: 'string', default: 'USD' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              'Invite sent to user email with confirmation fields (invite_email_sent, invite_sent_to, invite_expires_in_seconds)',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user with order and eSIM counts (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'User details' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiUserNotFoundRef,
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user profile (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'first_name',
                  'last_name',
                  'email',
                  'locale',
                  'currency',
                ],
                properties: {
                  first_name: { type: 'string', minLength: 1, maxLength: 100 },
                  last_name: { type: 'string', minLength: 1, maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string', maxLength: 25, nullable: true },
                  locale: { type: 'string', minLength: 2, maxLength: 10 },
                  currency: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 3,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiUserNotFoundRef,
          409: { description: 'Email already registered' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/users/{id}/toggle': {
      patch: {
        tags: ['Users'],
        summary: 'Activate or deactivate user (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['is_active'],
                properties: { is_active: { type: 'boolean' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Toggled' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiUserNotFoundRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/users/{id}/role': {
      patch: {
        tags: ['Users'],
        summary: 'Update user role (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: {
                    type: 'string',
                    enum: ['customer', 'manager', 'admin'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Role updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiUserNotFoundRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/users/{id}/resend-invite': {
      post: {
        tags: ['Users'],
        summary: 'Resend manager/admin invite email (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: {
            description:
              'Invite email re-sent with confirmation fields (invite_email_sent, invite_sent_to, invite_expires_in_seconds)',
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiUserNotFoundRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/contact': {
      post: {
        tags: ['Contact'],
        summary: 'Submit contact form (public)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['full_name', 'email', 'message'],
                properties: {
                  full_name: { type: 'string', minLength: 1, maxLength: 255 },
                  email: { type: 'string', format: 'email' },
                  phone: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 25,
                    nullable: true,
                  },
                  message: { type: 'string', minLength: 10, maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Submission accepted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example:
                            'Thank you for contacting us. We will get back to you shortly.',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/contact': {
      get: {
        tags: ['Contact'],
        summary: 'List contact submissions (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'is_read',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Paginated contact submissions' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/contact/{id}': {
      get: {
        tags: ['Contact'],
        summary: 'Get contact submission (marks as read)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Contact submission' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiContactSubmissionNotFoundRef,
        },
      },
    },
    '/admin/contact/{id}/read': {
      patch: {
        tags: ['Contact'],
        summary: 'Mark contact submission as read',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Marked as read' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: openApiContactSubmissionNotFoundRef,
        },
      },
    },
    '/content/{key}': {
      get: {
        tags: ['Content'],
        summary: 'Get published content block by key (public)',
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 1 },
          },
          {
            name: 'locale',
            in: 'query',
            schema: {
              type: 'string',
              minLength: 2,
              maxLength: 10,
              default: 'en',
            },
          },
        ],
        responses: {
          200: { description: 'Published content block' },
          404: { description: 'Content not found' },
        },
      },
    },
    '/admin/content': {
      get: {
        tags: ['Content'],
        summary: 'List content blocks (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Content blocks list and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/content/upload': {
      post: {
        tags: ['Content'],
        summary: 'Upload draft content asset (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'key', 'slot'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  key: { type: 'string', minLength: 1 },
                  slot: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Draft asset uploaded' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { description: 'Invalid key/slot/file upload' },
        },
      },
    },
    '/admin/content/{key}': {
      put: {
        tags: ['Content'],
        summary: 'Upsert content block (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['locale', 'type', 'value'],
                properties: {
                  locale: { type: 'string', minLength: 2, maxLength: 10 },
                  type: {
                    type: 'string',
                    enum: ['faq', 'promoCard', 'destinationCard', 'richText'],
                  },
                  value: {},
                  isPublished: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Content block upserted' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/content/{key}/{locale}/publish': {
      patch: {
        tags: ['Content'],
        summary: 'Toggle content published state (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 1 },
          },
          {
            name: 'locale',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 2, maxLength: 10 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isPublished'],
                properties: {
                  isPublished: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Content published state updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Content not found' },
        },
      },
    },
    '/admin/content/{key}/{locale}': {
      delete: {
        tags: ['Content'],
        summary: 'Delete content block (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 1 },
          },
          {
            name: 'locale',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 2, maxLength: 10 },
          },
        ],
        responses: {
          200: { description: 'Content block deleted' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Content not found' },
        },
      },
    },
    '/admin/invoices': {
      get: {
        tags: ['Orders'],
        summary: 'List invoices (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'user_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'currency',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Invoices array and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/invoices/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get invoice by id (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Invoice details' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Invoice not found' },
        },
      },
    },
    '/admin/invoices/{id}/regenerate': {
      post: {
        tags: ['Orders'],
        summary: 'Queue invoice PDF generation or overwrite (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'PDF generation queued' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Invoice not found' },
        },
      },
    },
    '/admin/reports/revenue': {
      get: {
        tags: ['Reports'],
        summary: 'Revenue report (admin)',
        description:
          'Aggregates confirmed, paid orders. Optional from/to filter on order created_at; optional currency (default USD).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'from',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'currency',
            in: 'query',
            required: false,
            schema: { type: 'string', default: 'USD' },
          },
        ],
        responses: {
          200: {
            description: 'Revenue aggregates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total_revenue: { type: 'string', example: '199.80' },
                        order_count: { type: 'integer', example: 20 },
                        average_order_value: {
                          type: 'string',
                          example: '9.99',
                        },
                        currency: { type: 'string', example: 'USD' },
                        period: {
                          type: 'object',
                          properties: {
                            from: {
                              type: 'string',
                              nullable: true,
                              example: '2026-03-01',
                            },
                            to: {
                              type: 'string',
                              nullable: true,
                              example: '2026-03-31',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/reports/orders': {
      get: {
        tags: ['Reports'],
        summary: 'Orders by status (admin)',
        description:
          'Counts orders grouped by status. Optional from/to on created_at.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'from',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          200: {
            description: 'Order status counts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 25 },
                        confirmed: { type: 'integer', example: 20 },
                        pending: { type: 'integer', example: 2 },
                        failed: { type: 'integer', example: 2 },
                        refunded: { type: 'integer', example: 1 },
                        period: {
                          type: 'object',
                          properties: {
                            from: { type: 'string', nullable: true },
                            to: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/reports/activations': {
      get: {
        tags: ['Reports'],
        summary: 'Provisioning jobs aggregate (admin)',
        description: 'Counts provisioning_jobs by status and success rate.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Activation job stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total_jobs: { type: 'integer', example: 20 },
                        success: { type: 'integer', example: 0 },
                        failed: { type: 'integer', example: 0 },
                        dead: { type: 'integer', example: 0 },
                        queued: { type: 'integer', example: 20 },
                        processing: { type: 'integer', example: 0 },
                        success_rate: { type: 'string', example: '0%' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/reports/popular-plans': {
      get: {
        tags: ['Reports'],
        summary: 'Popular plans by order count (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 5 },
          },
        ],
        responses: {
          200: {
            description: 'Top plans',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          plan_id: { type: 'integer', example: 1 },
                          plan_name: {
                            type: 'string',
                            example: '1GB Europe 7 Days',
                          },
                          data_mb: { type: 'integer', example: 1024 },
                          data_label: {
                            type: 'string',
                            nullable: true,
                            example: '5 GB',
                          },
                          validity_days: { type: 'integer', example: 7 },
                          price: { type: 'string', example: '9.99' },
                          order_count: { type: 'integer', example: 15 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/reports/usage': {
      get: {
        tags: ['Reports'],
        summary: 'Usage trends from usage_records (admin)',
        description:
          'Daily buckets of usage sync activity. When active_only=true (default), only rows linked to eSIM profiles in activated state are included. Omit from and to for the last 30 days (UTC).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Start date (inclusive, UTC calendar day)',
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'End date (inclusive, UTC calendar day)',
          },
          {
            name: 'active_only',
            in: 'query',
            schema: { type: 'boolean', default: true },
            description: 'Restrict to usage rows for activated eSIM profiles',
          },
        ],
        responses: {
          200: { description: 'series (daily) and period totals' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/reports/provider-health': {
      get: {
        tags: ['Reports'],
        summary: 'Provider health: sync, plans, orders (admin)',
        description:
          "Lists providers with latest plan synced_at, active plan count, and confirmed order count for that provider's plans.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Provider health rows',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          name: { type: 'string', example: 'Airalo' },
                          slug: { type: 'string', example: 'airalo' },
                          is_active: { type: 'boolean', example: true },
                          priority: { type: 'integer', example: 1 },
                          capabilities: {
                            type: 'object',
                            additionalProperties: true,
                            example: {
                              webhooks: true,
                              topup: false,
                              renewal: true,
                              usage_api: true,
                            },
                          },
                          synced_at: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                          },
                          plan_count: { type: 'integer', example: 3 },
                          total_orders: { type: 'integer', example: 20 },
                          status: {
                            type: 'string',
                            enum: ['healthy', 'warning', 'error'],
                            example: 'warning',
                          },
                          status_reasons: {
                            type: 'array',
                            items: { type: 'string' },
                            example: [
                              '1 failed provisioning job in the last 24 hours',
                            ],
                          },
                          failures: { type: 'integer', example: 1 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/provisioning-jobs': {
      get: {
        tags: ['Provisioning'],
        summary: 'List provisioning jobs (manager, admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['queued', 'processing', 'success', 'failed', 'dead'],
            },
          },
          {
            name: 'order_id',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Provisioning jobs and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/admin/provisioning-jobs/{id}/retry': {
      post: {
        tags: ['Provisioning'],
        summary: 'Queue manual provisioning retry (manager, admin)',
        description:
          'Manual retry is blocked for fresh processing jobs. Stale processing jobs (older than 15 minutes) are retryable. Jobs in failed or dead state can be retried. attempt_count is reset to 0 automatically when it has reached max_attempts or the job is dead; pass reset_attempts=true to force reset on any retry.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'reset_attempts',
            in: 'query',
            required: false,
            description:
              'When true, resets attempt_count to 0 and updates max_attempts from env. Also applied automatically when attempt_count >= max_attempts or job status is dead.',
            schema: {
              type: 'string',
              enum: ['true', 'false'],
              default: 'false',
            },
            example: 'true',
          },
        ],
        responses: {
          200: {
            description: 'Retry queued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        provisioning_job_id: { type: 'integer', example: 17 },
                        queued: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Job or order not found' },
          409: { description: 'Job already completed or still processing' },
          422: { $ref: '#/components/responses/ValidationError' },
          502: { description: 'Queue unavailable' },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications (customer)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'channel',
            in: 'query',
            schema: { type: 'string', enum: ['email', 'in_app'] },
          },
          {
            name: 'is_read',
            in: 'query',
            schema: { type: 'boolean' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 },
          },
        ],
        responses: {
          200: { description: 'Notifications array and pagination meta' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Unread notifications count (customer)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '{ count }' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read (customer)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Notification marked as read' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Notification not found' },
        },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read (customer)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Notifications marked as read' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/me': {
      get: {
        tags: ['Profile'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile (password_hash never returned)' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Update profile (avatar upload)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary',
                  },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  phone: { type: 'string' },
                  locale: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/me/password': {
      patch: {
        tags: ['Profile'],
        summary: 'Change password (keeps current session; revokes others)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['current_password', 'new_password'],
                properties: {
                  current_password: { type: 'string' },
                  new_password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 128,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          401: openApiUnauthorizedRef,
        },
      },
    },
    '/me/sessions': {
      get: {
        tags: ['Profile'],
        summary: 'List active sessions for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Sessions (token_hash never returned)' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      delete: {
        tags: ['Profile'],
        summary: 'Revoke all sessions except current',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Other sessions revoked' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/me/sessions/{id}': {
      delete: {
        tags: ['Profile'],
        summary: 'Revoke a specific session',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Session revoked' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Session not found' },
        },
      },
    },
    '/admin/me': {
      get: {
        tags: ['Admin'],
        summary: 'Get current manager/admin profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile (password_hash never returned)' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Update manager/admin profile (avatar upload)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary',
                  },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  phone: { type: 'string' },
                  locale: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/me/password': {
      patch: {
        tags: ['Admin'],
        summary:
          'Change password for manager/admin (keeps current session; revokes others)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['current_password', 'new_password'],
                properties: {
                  current_password: { type: 'string' },
                  new_password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 128,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/me/sessions': {
      get: {
        tags: ['Admin'],
        summary: 'List active sessions for current manager/admin',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Sessions (token_hash never returned)' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Revoke all other sessions for manager/admin',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Other sessions revoked' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
        },
      },
    },
    '/admin/me/sessions/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Revoke a specific session (manager/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: { description: 'Session revoked' },
          401: openApiUnauthorizedRef,
          403: openApiForbiddenRef,
          404: { description: 'Session not found' },
        },
      },
    },
  },
} as const satisfies Record<string, unknown>

export const swaggerRouter = Router()

swaggerRouter.get('/swagger.json', (_req, res) => {
  res.status(200).json(openApiSpec)
})

swaggerRouter.get('/docs', (_req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://unpkg.com; connect-src 'self' https://unpkg.com"
  )
  res.type('html').status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>mojoSim API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        SwaggerUIBundle({
          url: '/api/v1/swagger.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout"
        })
      }
    </script>
  </body>
</html>`)
})
