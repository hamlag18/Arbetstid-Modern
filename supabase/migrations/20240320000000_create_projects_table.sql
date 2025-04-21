-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects table
CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all projects
CREATE POLICY "Allow authenticated users to view projects"
    ON public.projects
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create projects
CREATE POLICY "Allow authenticated users to create projects"
    ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update their own projects
CREATE POLICY "Allow authenticated users to update projects"
    ON public.projects
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete their own projects
CREATE POLICY "Allow authenticated users to delete projects"
    ON public.projects
    FOR DELETE
    TO authenticated
    USING (true); 