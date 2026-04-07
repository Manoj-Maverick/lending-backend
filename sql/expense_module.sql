CREATE TABLE IF NOT EXISTS public.expense_categories (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name character varying(80) NOT NULL UNIQUE,
    is_fixed boolean NOT NULL DEFAULT false,
    description text,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.branch_expenses (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id integer NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    category_id integer NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    expense_date date NOT NULL,
    notes text,
    created_by integer REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_branch_expenses_branch_date
ON public.branch_expenses (branch_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_branch_expenses_category_date
ON public.branch_expenses (category_id, expense_date DESC);

CREATE TABLE IF NOT EXISTS public.staff_salary (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id integer NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    branch_id integer NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    salary_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (salary_amount >= 0),
    bonus numeric(12,2) NOT NULL DEFAULT 0 CHECK (bonus >= 0),
    deductions numeric(12,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
    month date NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'UNPAID'
        CHECK (status IN ('PAID', 'UNPAID', 'PARTIAL')),
    paid_date date,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT staff_salary_employee_month_unique UNIQUE (employee_id, month)
);

CREATE INDEX IF NOT EXISTS idx_staff_salary_branch_month
ON public.staff_salary (branch_id, month DESC);

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id integer NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    category_id integer NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    cycle character varying(20) NOT NULL DEFAULT 'MONTHLY'
        CHECK (cycle IN ('MONTHLY')),
    next_due_date date NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    notes text,
    created_by integer REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_due
ON public.recurring_expenses (branch_id, next_due_date)
WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.expense_files (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expense_id integer NOT NULL REFERENCES public.branch_expenses(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    uploaded_by integer REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_files_expense
ON public.expense_files (expense_id);

INSERT INTO public.expense_categories (name, is_fixed, description)
VALUES
    ('RENT', true, 'Branch rent or lease amount'),
    ('SALARY', true, 'Reserved category for reporting alignment'),
    ('INTERNET', true, 'Internet and connectivity charges'),
    ('SECURITY', true, 'Security staff or service charges'),
    ('EB', false, 'Electricity expenses'),
    ('TEA_SNACKS', false, 'Tea, snacks, and refreshments'),
    ('TRAVEL', false, 'Travel and fuel reimbursements'),
    ('REPAIRS', false, 'Repair and maintenance expenses'),
    ('MISC', false, 'Miscellaneous branch expenses')
ON CONFLICT (name) DO NOTHING;
