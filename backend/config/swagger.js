const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'API documentation for Task Management System',
      contact: {
        name: 'API Support',
        email: 'support@taskmanagement.com',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'username', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1,
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'john_doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
              example: 'john@example.com',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Event: {
          type: 'object',
          required: ['id', 'title', 'start_date', 'user_id'],
          properties: {
            id: {
              type: 'integer',
              description: 'Event ID',
              example: 1,
            },
            title: {
              type: 'string',
              description: 'Event title',
              example: 'Họp team',
            },
            start_date: {
              type: 'string',
              format: 'date-time',
              description: 'Event start date',
              example: '2025-09-29T10:00:00Z',
            },
            end_date: {
              type: 'string',
              format: 'date-time',
              description: 'Event end date',
              example: '2025-09-29T11:00:00Z',
              nullable: true,
            },
            description: {
              type: 'string',
              description: 'Event description',
              example: 'Weekly team meeting',
              nullable: true,
            },
            user_id: {
              type: 'integer',
              description: 'User ID who created the event',
              example: 1,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        CreateEventRequest: {
          type: 'object',
          required: ['title', 'start_date'],
          properties: {
            title: {
              type: 'string',
              description: 'Event title',
              example: 'Họp team',
            },
            start_date: {
              type: 'string',
              format: 'date-time',
              description: 'Event start date',
              example: '2025-09-29T10:00:00Z',
            },
            end_date: {
              type: 'string',
              format: 'date-time',
              description: 'Event end date',
              example: '2025-09-29T11:00:00Z',
              nullable: true,
            },
            description: {
              type: 'string',
              description: 'Event description',
              example: 'Weekly team meeting',
              nullable: true,
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: {
              type: 'string',
              description: 'Username or email',
              example: 'john_doe',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'password123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login successful',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: {
                      type: 'string',
                      description: 'JWT access token',
                    },
                    refreshToken: {
                      type: 'string',
                      description: 'JWT refresh token',
                    },
                  },
                },
              },
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Error details',
            },
          },
        },
        TaskStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of tasks',
              example: 50,
            },
            completed: {
              type: 'integer',
              description: 'Number of completed tasks',
              example: 30,
            },
            in_progress: {
              type: 'integer',
              description: 'Number of tasks in progress',
              example: 15,
            },
            not_started: {
              type: 'integer',
              description: 'Number of tasks not started',
              example: 5,
            },
            overdue: {
              type: 'integer',
              description: 'Number of overdue tasks',
              example: 3,
            },
          },
        },
        UserStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of users',
              example: 142,
            },
            active: {
              type: 'integer',
              description: 'Number of active users',
              example: 135,
            },
            inactive: {
              type: 'integer',
              description: 'Number of inactive users',
              example: 7,
            },
            new_last_30_days: {
              type: 'integer',
              description: 'Number of new users in last 30 days',
              example: 12,
            },
          },
        },
        AdminStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of admins',
              example: 5,
            },
            active: {
              type: 'integer',
              description: 'Number of active admins',
              example: 4,
            },
          },
        },
        TokenStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of tokens',
              example: 200,
            },
            active: {
              type: 'integer',
              description: 'Number of active tokens',
              example: 150,
            },
            revoked: {
              type: 'integer',
              description: 'Number of revoked tokens',
              example: 30,
            },
            expired: {
              type: 'integer',
              description: 'Number of expired tokens',
              example: 20,
            },
          },
        },
        AdminDashboardStats: {
          type: 'object',
          properties: {
            users: {
              $ref: '#/components/schemas/UserStats',
            },
            admins: {
              $ref: '#/components/schemas/AdminStats',
            },
            tokens: {
              $ref: '#/components/schemas/TokenStats',
            },
            tasks: {
              $ref: '#/components/schemas/TaskStats',
            },
          },
        },
        UserDashboardStats: {
          type: 'object',
          properties: {
            tasks: {
              $ref: '#/components/schemas/TaskStats',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Notification ID',
              example: 1,
            },
            user_id: {
              type: 'integer',
              description: 'User ID who receives this notification',
              example: 2,
            },
            task_id: {
              type: 'integer',
              description: 'Related task ID',
              example: 5,
              nullable: true,
            },
            report_id: {
              type: 'integer',
              description: 'Related report ID',
              example: 3,
              nullable: true,
            },
            type: {
              type: 'string',
              enum: ['task_assigned', 'task_updated', 'task_completed', 'deadline_reminder', 'report_submitted'],
              description: 'Notification type',
              example: 'report_submitted',
            },
            title: {
              type: 'string',
              description: 'Notification title',
              example: 'Báo cáo mới được gửi',
            },
            message: {
              type: 'string',
              description: 'Notification message',
              example: 'John Doe đã gửi báo cáo cho task: Hoàn thành tính năng X',
              nullable: true,
            },
            is_read: {
              type: 'boolean',
              description: 'Read status',
              example: false,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            task_title: {
              type: 'string',
              description: 'Task title (joined from tasks table)',
              example: 'Hoàn thành tính năng X',
              nullable: true,
            },
            reporter_username: {
              type: 'string',
              description: 'Reporter username (for report_submitted type)',
              example: 'john_doe',
              nullable: true,
            },
            reporter_first_name: {
              type: 'string',
              description: 'Reporter first name',
              example: 'John',
              nullable: true,
            },
            reporter_last_name: {
              type: 'string',
              description: 'Reporter last name',
              example: 'Doe',
              nullable: true,
            },
          },
        },
        Project: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Project ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Project name',
              example: 'Website Redesign Project',
            },
            description: {
              type: 'string',
              description: 'Project description',
              example: 'Complete redesign of company website',
              nullable: true,
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: 'Project start date',
              example: '2025-01-01',
              nullable: true,
            },
            end_date: {
              type: 'string',
              format: 'date',
              description: 'Project end date',
              example: '2025-06-30',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Conversation: {
          type: 'object',
          required: ['id', 'type'],
          properties: {
            id: {
              type: 'integer',
              description: 'Conversation ID',
              example: 1,
            },
            type: {
              type: 'string',
              enum: ['direct', 'group'],
              description: 'Conversation type',
              example: 'direct',
            },
            name: {
              type: 'string',
              description: 'Group name (for group conversations)',
              example: 'Project Team',
              nullable: true,
            },
            created_by: {
              type: 'integer',
              description: 'User ID who created the conversation',
              example: 1,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
            last_message: {
              type: 'string',
              description: 'Last message content',
              example: 'Hello team!',
              nullable: true,
            },
            unread_count: {
              type: 'integer',
              description: 'Number of unread messages',
              example: 3,
            },
            participants: {
              type: 'array',
              description: 'List of participants',
              items: {
                type: 'object',
                properties: {
                  user_id: {
                    type: 'integer',
                  },
                  username: {
                    type: 'string',
                  },
                  email: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        Message: {
          type: 'object',
          required: ['id', 'conversation_id', 'sender_id', 'message_type'],
          properties: {
            id: {
              type: 'integer',
              description: 'Message ID',
              example: 1,
            },
            conversation_id: {
              type: 'integer',
              description: 'Conversation ID',
              example: 1,
            },
            sender_id: {
              type: 'integer',
              description: 'User ID who sent the message',
              example: 1,
            },
            content: {
              type: 'string',
              description: 'Message content',
              example: 'Hello team!',
              nullable: true,
            },
            message_type: {
              type: 'string',
              enum: ['text', 'image', 'file'],
              description: 'Message type',
              example: 'text',
            },
            file_url: {
              type: 'string',
              description: 'File URL (for image/file messages)',
              example: '/uploads/chat/image.jpg',
              nullable: true,
            },
            file_name: {
              type: 'string',
              description: 'Original file name',
              example: 'image.jpg',
              nullable: true,
            },
            attachments: {
              type: 'array',
              description: 'Multiple file attachments',
              items: {
                type: 'object',
                properties: {
                  file_url: {
                    type: 'string',
                  },
                  file_name: {
                    type: 'string',
                  },
                },
              },
              nullable: true,
            },
            is_edited: {
              type: 'boolean',
              description: 'Whether message was edited',
              example: false,
            },
            is_deleted: {
              type: 'boolean',
              description: 'Whether message was deleted',
              example: false,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
            sender_username: {
              type: 'string',
              description: 'Sender username',
              example: 'john_doe',
            },
            sender_email: {
              type: 'string',
              description: 'Sender email',
              example: 'john@example.com',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
  ],
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Task Management API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions,
};