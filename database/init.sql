-- ============================================
  -- SAMPLE DATA FOR TESTING
  -- ============================================

  -- Admin account (password: Password123)
  INSERT INTO user_admin (username, email, password_hash, role, is_active, created_at, updated_at)
  VALUES
  ('thanh1212', 'admin@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmXjIHPWq6', 'admin', true, NOW(), NOW());

  -- Regular users (password: password123)
  INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, created_at, updated_at)
  VALUES
  ('john', 'john@test.com', 'John', 'Doe', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmXjIHPWq6', true, NOW(), NOW()),
  ('jane', 'jane@test.com', 'Jane', 'Smith', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmXjIHPWq6', true, NOW(), NOW());

  -- Sample project
  INSERT INTO projects (name, description, status, created_by, created_at, updated_at)
  VALUES
  ('Task Management System', 'Development of task management application', 'active', 1, NOW(), NOW());

  -- Sample tasks (note: start_date is required, using due_date - 7 days)
  INSERT INTO tasks (title, description, status, priority, start_date, due_date, assignee_id, creator_id, project_id, created_at, updated_at)
  VALUES
  ('Setup Development Environment', 'Install Node.js, PostgreSQL, Docker', 'completed', 'high', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days', 1, 1, 1, NOW() - INTERVAL '7 days', NOW()),
  ('Design Database Schema', 'Create ERD and implement PostgreSQL schema', 'completed', 'high', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 1, 1, 1, NOW() - INTERVAL '6 days', NOW()),
  ('Implement Authentication', 'JWT + Google OAuth integration', 'in_progress', 'high', NOW() - INTERVAL '4 days', NOW() + INTERVAL '2 days', 1, 1, 1, NOW() - INTERVAL '4 days', NOW()),
  ('Build Chat Feature', 'Real-time chat with Socket.io', 'in_progress', 'medium', NOW() - INTERVAL '3 days', NOW() + INTERVAL '5 days', 2, 1, 1, NOW() - INTERVAL '3 days', NOW()),
  ('Create Dashboard', 'Admin dashboard with statistics', 'not_started', 'medium', NOW(), NOW() + INTERVAL '7 days', 2, 1, 1, NOW() - INTERVAL '2 days', NOW());

  -- Reset sequences to continue from correct ID
  SELECT setval('user_admin_id_seq', (SELECT MAX(id) FROM user_admin));
  SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
  SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));
  SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));

  -- Password hashes:
  -- - Admin: Password123
  -- - Users: password123