import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

const AuthListener = () => {
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session);
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in:', session.user.id);
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking user profile:', fetchError);
          toast.error('Failed to check user profile.');
          return;
        }

        if (!existingProfile) {
          console.log('No user profile found, creating one...');
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                created_at: new Date().toISOString(),
                email_confirmed_at: session.user.email_confirmed_at || new Date().toISOString()
              },
            ])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            toast.error('Failed to create user profile: ' + insertError.message);
          } else {
            console.log('User profile created:', newProfile);
            toast.success('Profile created successfully!');
          }
        } else {
          console.log('User profile already exists:', existingProfile);
        }
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return null; // This component doesn't render anything
};

export default AuthListener;