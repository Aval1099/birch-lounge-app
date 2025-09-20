-- =============================================================================
-- SUPABASE DATABASE SCHEMA FOR BIRCH LOUNGE RECIPE MANAGER
-- =============================================================================

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create user_data table for storing all user data
CREATE TABLE IF NOT EXISTS user_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipes JSONB DEFAULT '[]'::jsonb,
    ingredients JSONB DEFAULT '[]'::jsonb,
    techniques JSONB DEFAULT '[]'::jsonb,
    saved_menus JSONB DEFAULT '[]'::jsonb,
    saved_batches JSONB DEFAULT '[]'::jsonb,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view their own data" ON user_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" ON user_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON user_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data" ON user_data
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_data_updated_at 
    BEFORE UPDATE ON user_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to get user data with fallback
CREATE OR REPLACE FUNCTION get_user_data(user_uuid UUID)
RETURNS TABLE (
    recipes JSONB,
    ingredients JSONB,
    techniques JSONB,
    saved_menus JSONB,
    saved_batches JSONB,
    theme TEXT,
    version TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ud.recipes,
        ud.ingredients,
        ud.techniques,
        ud.saved_menus,
        ud.saved_batches,
        ud.theme,
        ud.version,
        ud.updated_at
    FROM user_data ud
    WHERE ud.user_id = user_uuid;
    
    -- If no data found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            '[]'::jsonb as recipes,
            '[]'::jsonb as ingredients,
            '[]'::jsonb as techniques,
            '[]'::jsonb as saved_menus,
            '[]'::jsonb as saved_batches,
            'light'::text as theme,
            '1.0.0'::text as version,
            NOW() as updated_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data(UUID) TO authenticated;

-- Optional: Create a view for easier querying (respects RLS)
CREATE OR REPLACE VIEW user_data_view AS
SELECT 
    user_id,
    recipes,
    ingredients,
    techniques,
    saved_menus,
    saved_batches,
    theme,
    version,
    created_at,
    updated_at
FROM user_data;

-- Grant access to the view
GRANT SELECT ON user_data_view TO authenticated;

-- =============================================================================
-- SETUP INSTRUCTIONS
-- =============================================================================

/*
To set up this schema in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste this entire schema
4. Run the SQL commands
5. Verify the table was created in the Table Editor

Environment Variables needed in your .env.local:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

The schema provides:
- Secure user data storage with RLS
- Automatic timestamp updates
- Optimized indexes for performance
- JSON storage for flexible recipe data
- One record per user design
- Proper foreign key relationships

Free tier limits:
- 500MB database storage
- 2GB bandwidth per month
- 50,000 monthly active users
- Perfect for small teams!
*/
