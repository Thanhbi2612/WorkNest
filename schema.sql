--
-- PostgreSQL database dump
--

-- \restrict muFErj2peJ5FHEqZseVEDvgQ2MRaQ5Ar0fSS7CMUBHNYdEW3VKb6HhMAjvYqAmz (commented out for deployment)

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;  -- Not supported in PostgreSQL 14
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: conversation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.conversation_type AS ENUM (
    'direct',
    'group'
);


--
-- Name: message_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_type AS ENUM (
    'text',
    'file',
    'image'
);


--
-- Name: participant_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.participant_type AS ENUM (
    'user',
    'admin'
);


--
-- Name: create_direct_conversation(integer, public.participant_type, integer, public.participant_type); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_direct_conversation(p1_id integer, p1_type public.participant_type, p2_id integer, p2_type public.participant_type) RETURNS integer
    LANGUAGE plpgsql
    AS $$
  DECLARE
      conversation_id INT;
      existing_conv_id INT;
  BEGIN
      -- Kiß╗âm tra xem conversation ─æ├ú tß╗ôn tß║íi ch╞░a
      SELECT c.id INTO existing_conv_id
      FROM conversations c
      WHERE c.type = 'direct'
      AND EXISTS (
          SELECT 1 FROM conversation_participants cp1
          WHERE cp1.conversation_id = c.id
          AND cp1.participant_id = p1_id
          AND cp1.participant_type = p1_type
      )
      AND EXISTS (
          SELECT 1 FROM conversation_participants cp2
          WHERE cp2.conversation_id = c.id
          AND cp2.participant_id = p2_id
          AND cp2.participant_type = p2_type
      )
      AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2;

      -- Nß║┐u ─æ├ú tß╗ôn tß║íi, return ID
      IF existing_conv_id IS NOT NULL THEN
          RETURN existing_conv_id;
      END IF;

      -- Tß║ío mß╗¢i conversation
      INSERT INTO conversations (type) VALUES ('direct') RETURNING id INTO conversation_id;

      -- Th├¬m participants
      INSERT INTO conversation_participants (conversation_id, participant_id, participant_type)
      VALUES
          (conversation_id, p1_id, p1_type),
          (conversation_id, p2_id, p2_type);

      RETURN conversation_id;
  END;
  $$;


--
-- Name: get_unread_count(integer, integer, public.participant_type); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unread_count(p_conversation_id integer, p_participant_id integer, p_participant_type public.participant_type) RETURNS integer
    LANGUAGE plpgsql
    AS $$
  DECLARE
      last_read TIMESTAMP;
      unread_count INT;
  BEGIN
      -- Lß║Ñy thß╗¥i ─æiß╗âm ─æß╗ìc cuß╗æi c├╣ng
      SELECT last_read_at INTO last_read
      FROM conversation_participants
      WHERE conversation_id = p_conversation_id
      AND participant_id = p_participant_id
      AND participant_type = p_participant_type;

      -- ─Éß║┐m messages ch╞░a ─æß╗ìc
      IF last_read IS NULL THEN
          -- Ch╞░a ─æß╗ìc lß║ºn n├áo, ─æß║┐m tß║Ñt cß║ú messages
          SELECT COUNT(*) INTO unread_count
          FROM messages
          WHERE conversation_id = p_conversation_id
          AND NOT (sender_id = p_participant_id AND sender_type = p_participant_type);
      ELSE
          -- ─Éß║┐m messages sau thß╗¥i ─æiß╗âm ─æß╗ìc cuß╗æi
          SELECT COUNT(*) INTO unread_count
          FROM messages
          WHERE conversation_id = p_conversation_id
          AND created_at > last_read
          AND NOT (sender_id = p_participant_id AND sender_type = p_participant_type);
      END IF;

      RETURN COALESCE(unread_count, 0);
  END;
  $$;


--
-- Name: mark_conversation_as_read(integer, integer, public.participant_type); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_conversation_as_read(p_conversation_id integer, p_participant_id integer, p_participant_type public.participant_type) RETURNS void
    LANGUAGE plpgsql
    AS $$
  BEGIN
      UPDATE conversation_participants
      SET last_read_at = NOW()
      WHERE conversation_id = p_conversation_id
      AND participant_id = p_participant_id
      AND participant_type = p_participant_type;
  END;
  $$;


--
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = NEW.conversation_id;
      RETURN NEW;
  END;
  $$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_participants (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    participant_id integer NOT NULL,
    participant_type public.participant_type DEFAULT 'user'::public.participant_type NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_read_at timestamp without time zone
);


--
-- Name: TABLE conversation_participants; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.conversation_participants IS 'L╞░u danh s├ích th├ánh vi├¬n cß╗ºa tß╗½ng cuß╗Öc hß╗Öi thoß║íi (hß╗ù trß╗ú cß║ú users v├á admins)';


--
-- Name: COLUMN conversation_participants.participant_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation_participants.participant_id IS 'ID cß╗ºa user hoß║╖c admin';


--
-- Name: COLUMN conversation_participants.participant_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation_participants.participant_type IS 'Loß║íi participant: user hoß║╖c admin';


--
-- Name: COLUMN conversation_participants.last_read_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversation_participants.last_read_at IS 'Thß╗¥i ─æiß╗âm participant ─æß╗ìc tin nhß║»n cuß╗æi c├╣ng (d├╣ng ─æß╗â t├¡nh unread count)';


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_participants_id_seq OWNED BY public.conversation_participants.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    type public.conversation_type DEFAULT 'direct'::public.conversation_type NOT NULL,
    name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_group_has_name CHECK ((((type = 'group'::public.conversation_type) AND (name IS NOT NULL)) OR ((type = 'direct'::public.conversation_type) AND (name IS NULL))))
);


--
-- Name: TABLE conversations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.conversations IS 'L╞░u th├┤ng tin c├íc cuß╗Öc hß╗Öi thoß║íi (direct hoß║╖c group chat)';


--
-- Name: COLUMN conversations.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversations.type IS 'Loß║íi cuß╗Öc hß╗Öi thoß║íi: direct (1-1) hoß║╖c group (nhiß╗üu ng╞░ß╗¥i)';


--
-- Name: COLUMN conversations.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.conversations.name IS 'T├¬n nh├│m chat (chß╗ë d├╣ng cho group, NULL cho direct)';


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    description text,
    user_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_attachments (
    id integer NOT NULL,
    message_id integer,
    file_path character varying(500),
    file_name character varying(255),
    file_size integer,
    file_type character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: message_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_attachments_id_seq OWNED BY public.message_attachments.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    sender_type public.participant_type DEFAULT 'user'::public.participant_type NOT NULL,
    message_text text,
    message_type public.message_type DEFAULT 'text'::public.message_type NOT NULL,
    file_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    edited_at timestamp without time zone,
    CONSTRAINT chk_edited_has_timestamp CHECK ((((is_edited = true) AND (edited_at IS NOT NULL)) OR (is_edited = false))),
    CONSTRAINT chk_text_message_not_empty CHECK ((((message_type = 'text'::public.message_type) AND (message_text IS NOT NULL) AND (length(TRIM(BOTH FROM message_text)) > 0)) OR (message_type = ANY (ARRAY['file'::public.message_type, 'image'::public.message_type]))))
);


--
-- Name: TABLE messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.messages IS 'L╞░u tß║Ñt cß║ú tin nhß║»n trong hß╗ç thß╗æng chat';


--
-- Name: COLUMN messages.sender_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.sender_id IS 'ID cß╗ºa ng╞░ß╗¥i gß╗¡i (user hoß║╖c admin)';


--
-- Name: COLUMN messages.sender_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.sender_type IS 'Loß║íi ng╞░ß╗¥i gß╗¡i: user hoß║╖c admin';


--
-- Name: COLUMN messages.message_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.message_type IS 'Loß║íi tin nhß║»n: text, file, hoß║╖c image';


--
-- Name: COLUMN messages.file_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.file_url IS 'URL file ─æ├¡nh k├¿m (chß╗ë d├╣ng cho file/image)';


--
-- Name: COLUMN messages.is_edited; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.is_edited IS 'Tin nhß║»n c├│ bß╗ï chß╗ënh sß╗¡a hay kh├┤ng';


--
-- Name: COLUMN messages.edited_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.messages.edited_at IS 'Thß╗¥i ─æiß╗âm chß╗ënh sß╗¡a tin nhß║»n';


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    report_id integer,
    conversation_id integer,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['task_assigned'::character varying, 'task_updated'::character varying, 'task_completed'::character varying, 'deadline_reminder'::character varying, 'calendar_event_created'::character varying, 'calendar_event_updated'::character varying, 'calendar_event_reminder'::character varying, 'report_submitted'::character varying, 'report_approved'::character varying, 'report_rejected'::character varying, 'project_created'::character varying, 'project_updated'::character varying, 'message_new'::character varying])::text[])))
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_by integer NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    user_type character varying(20) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_revoked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT refresh_tokens_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying])::text[])))
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.refresh_tokens IS 'Stores refresh tokens for both admin and user authentication';


--
-- Name: COLUMN refresh_tokens.user_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refresh_tokens.user_type IS 'Type of user: admin or user';


--
-- Name: COLUMN refresh_tokens.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refresh_tokens.expires_at IS 'When the refresh token expires';


--
-- Name: COLUMN refresh_tokens.is_revoked; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refresh_tokens.is_revoked IS 'Whether the token has been revoked manually';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_attachments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    file_type character varying(100),
    uploaded_by integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: task_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_attachments_id_seq OWNED BY public.task_attachments.id;


--
-- Name: task_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_files (
    id integer NOT NULL,
    task_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer NOT NULL,
    file_type character varying(100) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE task_files; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.task_files IS 'Bß║úng l╞░u trß╗» c├íc file ─æ├¡nh k├¿m cß╗ºa task';


--
-- Name: COLUMN task_files.task_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_files.task_id IS 'ID cß╗ºa task (foreign key)';


--
-- Name: COLUMN task_files.file_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_files.file_name IS 'T├¬n file gß╗æc';


--
-- Name: COLUMN task_files.file_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_files.file_path IS '─É╞░ß╗¥ng dß║½n l╞░u file tr├¬n server';


--
-- Name: COLUMN task_files.file_size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_files.file_size IS 'K├¡ch th╞░ß╗¢c file (bytes)';


--
-- Name: COLUMN task_files.file_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_files.file_type IS 'MIME type cß╗ºa file';


--
-- Name: COLUMN task_files.uploaded_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_files.uploaded_at IS 'Thß╗¥i gian upload file';


--
-- Name: task_files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_files_id_seq OWNED BY public.task_files.id;


--
-- Name: task_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_reports (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    description text NOT NULL,
    file_url character varying(500),
    file_name character varying(255),
    file_size integer,
    file_type character varying(100),
    status character varying(20) DEFAULT 'draft'::character varying,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by integer,
    CONSTRAINT task_reports_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying])::text[])))
);


--
-- Name: COLUMN task_reports.is_resolved; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_reports.is_resolved IS '─É├ính dß║Ñu report ─æ├ú ─æ╞░ß╗úc admin xß╗¡ l├╜ ch╞░a (FALSE=pending, TRUE=resolved)';


--
-- Name: COLUMN task_reports.resolved_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_reports.resolved_at IS 'Thß╗¥i ─æiß╗âm admin ─æ├ính dß║Ñu report ─æ├ú xß╗¡ l├╜';


--
-- Name: COLUMN task_reports.resolved_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_reports.resolved_by IS 'ID cß╗ºa admin ─æ├ú ─æ├ính dß║Ñu report ho├án th├ánh (FK to user_admin)';


--
-- Name: task_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_reports_id_seq OWNED BY public.task_reports.id;


--
-- Name: task_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_tags (
    id integer NOT NULL,
    task_id integer NOT NULL,
    tag_name character varying(100) NOT NULL
);


--
-- Name: task_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_tags_id_seq OWNED BY public.task_tags.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    assignee_id integer NOT NULL,
    watcher_id integer,
    creator_id integer NOT NULL,
    project_id integer,
    start_date date NOT NULL,
    due_date date NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'not_started'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_confirmed boolean DEFAULT false,
    confirmed_at timestamp without time zone,
    confirmed_by integer,
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_admin (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    avatar_url character varying(500) DEFAULT NULL::character varying
);


--
-- Name: user_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_admin_id_seq OWNED BY public.user_admin.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255),
    role character varying(50) DEFAULT 'user'::character varying,
    first_name character varying(100),
    last_name character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    google_id character varying(255),
    avatar_url character varying(500),
    auth_provider character varying(20) DEFAULT 'local'::character varying,
    CONSTRAINT users_auth_provider_check CHECK (((auth_provider)::text = ANY ((ARRAY['local'::character varying, 'google'::character varying])::text[])))
);


--
-- Name: COLUMN users.google_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.google_id IS 'Google user ID for OAuth authentication';


--
-- Name: COLUMN users.avatar_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar/profile picture from Google';


--
-- Name: COLUMN users.auth_provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.auth_provider IS 'Authentication provider: local or google';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_participant_info; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_participant_info AS
 SELECT 'user'::public.participant_type AS participant_type,
    users.id AS participant_id,
    users.username,
    users.email,
    concat(users.first_name, ' ', users.last_name) AS full_name,
    users.first_name,
    users.last_name,
    users.is_active,
    users.created_at
   FROM public.users
UNION ALL
 SELECT 'admin'::public.participant_type AS participant_type,
    user_admin.id AS participant_id,
    user_admin.username,
    user_admin.email,
    user_admin.username AS full_name,
    NULL::character varying AS first_name,
    NULL::character varying AS last_name,
    user_admin.is_active,
    user_admin.created_at
   FROM public.user_admin;


--
-- Name: v_conversation_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_conversation_details AS
 SELECT c.id AS conversation_id,
    c.type AS conversation_type,
    c.name AS conversation_name,
    c.created_at,
    c.updated_at,
    cp.participant_id,
    cp.participant_type,
    cp.joined_at,
    cp.last_read_at,
    p.username,
    p.email,
    p.full_name
   FROM ((public.conversations c
     JOIN public.conversation_participants cp ON ((c.id = cp.conversation_id)))
     JOIN public.v_participant_info p ON (((cp.participant_id = p.participant_id) AND (cp.participant_type = p.participant_type))));


--
-- Name: v_message_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_message_details AS
 SELECT m.id AS message_id,
    m.conversation_id,
    m.sender_id,
    m.sender_type,
    p.username AS sender_username,
    p.full_name AS sender_name,
    m.message_text,
    m.message_type,
    m.file_url,
    m.created_at,
    m.is_edited,
    m.edited_at
   FROM (public.messages m
     JOIN public.v_participant_info p ON (((m.sender_id = p.participant_id) AND (m.sender_type = p.participant_type))));


--
-- Name: conversation_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants ALTER COLUMN id SET DEFAULT nextval('public.conversation_participants_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: message_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments ALTER COLUMN id SET DEFAULT nextval('public.message_attachments_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: task_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments ALTER COLUMN id SET DEFAULT nextval('public.task_attachments_id_seq'::regclass);


--
-- Name: task_files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_files ALTER COLUMN id SET DEFAULT nextval('public.task_files_id_seq'::regclass);


--
-- Name: task_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_reports ALTER COLUMN id SET DEFAULT nextval('public.task_reports_id_seq'::regclass);


--
-- Name: task_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags ALTER COLUMN id SET DEFAULT nextval('public.task_tags_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_admin id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_admin ALTER COLUMN id SET DEFAULT nextval('public.user_admin_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: message_attachments message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- Name: task_files task_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_files
    ADD CONSTRAINT task_files_pkey PRIMARY KEY (id);


--
-- Name: task_reports task_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_reports
    ADD CONSTRAINT task_reports_pkey PRIMARY KEY (id);


--
-- Name: task_reports task_reports_task_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_reports
    ADD CONSTRAINT task_reports_task_id_user_id_key UNIQUE (task_id, user_id);


--
-- Name: task_tags task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_pkey PRIMARY KEY (id);


--
-- Name: task_tags task_tags_task_id_tag_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_task_id_tag_name_key UNIQUE (task_id, tag_name);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants uq_conversation_participant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, participant_id, participant_type);


--
-- Name: user_admin user_admin_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_admin
    ADD CONSTRAINT user_admin_email_key UNIQUE (email);


--
-- Name: user_admin user_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_admin
    ADD CONSTRAINT user_admin_pkey PRIMARY KEY (id);


--
-- Name: user_admin user_admin_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_admin
    ADD CONSTRAINT user_admin_username_key UNIQUE (username);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_conversations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_created_at ON public.conversations USING btree (created_at DESC);


--
-- Name: idx_conversations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_type ON public.conversations USING btree (type);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_conversation_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id, sender_type);


--
-- Name: idx_notifications_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_conversation_id ON public.notifications USING btree (conversation_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read) WHERE (is_read = false);


--
-- Name: idx_notifications_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_task_id ON public.notifications USING btree (task_id) WHERE (task_id IS NOT NULL);


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_read_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_read_created ON public.notifications USING btree (user_id, is_read, created_at DESC);


--
-- Name: idx_notifications_user_type_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_type_read ON public.notifications USING btree (user_id, type, is_read);


--
-- Name: idx_participants_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_conversation ON public.conversation_participants USING btree (conversation_id);


--
-- Name: idx_participants_last_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_last_read ON public.conversation_participants USING btree (last_read_at);


--
-- Name: idx_participants_participant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_participant ON public.conversation_participants USING btree (participant_id, participant_type);


--
-- Name: idx_refresh_tokens_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_active ON public.refresh_tokens USING btree (is_revoked, expires_at);


--
-- Name: idx_refresh_tokens_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_expires ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id, user_type);


--
-- Name: idx_task_files_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_files_task_id ON public.task_files USING btree (task_id);


--
-- Name: idx_task_reports_is_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_reports_is_resolved ON public.task_reports USING btree (is_resolved);


--
-- Name: idx_task_reports_resolved_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_reports_resolved_at ON public.task_reports USING btree (resolved_at DESC NULLS LAST);


--
-- Name: idx_task_reports_resolved_combo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_reports_resolved_combo ON public.task_reports USING btree (is_resolved, resolved_at DESC);


--
-- Name: idx_task_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_reports_status ON public.task_reports USING btree (status);


--
-- Name: idx_task_reports_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_reports_task_id ON public.task_reports USING btree (task_id);


--
-- Name: idx_task_reports_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_reports_user_id ON public.task_reports USING btree (user_id);


--
-- Name: idx_tasks_confirmed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_confirmed_at ON public.tasks USING btree (confirmed_at);


--
-- Name: idx_tasks_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_created_at ON public.tasks USING btree (created_at DESC);


--
-- Name: idx_tasks_is_confirmed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_is_confirmed ON public.tasks USING btree (is_confirmed);


--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_users_auth_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_auth_provider ON public.users USING btree (auth_provider);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: messages trigger_update_conversation_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_conversation_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages fk_message_conversation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_conversation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_task; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: conversation_participants fk_participant_conversation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT fk_participant_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: projects fk_projects_creator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: task_attachments fk_task_attachments_task; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT fk_task_attachments_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_attachments fk_task_attachments_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT fk_task_attachments_user FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: task_files fk_task_files_task_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_files
    ADD CONSTRAINT fk_task_files_task_id FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_reports fk_task_reports_resolved_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_reports
    ADD CONSTRAINT fk_task_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES public.user_admin(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_tags fk_task_tags_task; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT fk_task_tags_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks fk_tasks_assignee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks fk_tasks_creator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_creator FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: tasks fk_tasks_project; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: tasks fk_tasks_watcher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_watcher FOREIGN KEY (watcher_id) REFERENCES public.users(id);


--
-- Name: message_attachments message_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: notifications notifications_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.task_reports(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: task_files task_files_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_files
    ADD CONSTRAINT task_files_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_reports task_reports_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_reports
    ADD CONSTRAINT task_reports_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_reports task_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_reports
    ADD CONSTRAINT task_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.user_admin(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict muFErj2peJ5FHEqZseVEDvgQ2MRaQ5Ar0fSS7CMUBHNYdEW3VKb6HhMAjvYqAmz

