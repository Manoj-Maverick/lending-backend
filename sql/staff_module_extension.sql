CREATE TABLE IF NOT EXISTS public.staff_details (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id integer NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    date_of_birth date,
    gender character varying(20),
    alternate_phone character varying(15),
    marital_status character varying(20),
    blood_group character varying(10),
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(15),
    emergency_contact_relationship character varying(50),
    father_name character varying(100),
    mother_name character varying(100),
    aadhaar_number character varying(20),
    pan_number character varying(20),
    bank_name character varying(100),
    account_holder_name character varying(100),
    bank_account_number character varying(30),
    ifsc_code character varying(20),
    account_type character varying(20),
    education character varying(100),
    experience_years numeric(5,2),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id integer NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date date NOT NULL,
    check_in_time timestamp without time zone,
    check_out_time timestamp without time zone,
    status character varying(20) DEFAULT 'PRESENT' NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT staff_attendance_employee_date_unique UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_employee_date
ON public.staff_attendance (employee_id, attendance_date DESC);
