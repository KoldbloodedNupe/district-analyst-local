import { supabase } from './supabaseClient.ts';
import { User } from '@supabase/supabase-js';
import { Opportunity, OperationalParameters, TriageResults, MissionBriefing } from './types.ts';

// --- INTERFACES ---
export interface MissionLog {
  id: string;
  created_at: string;
  sector: string;
  lane: string;
  result_count: number;
  full_results: TriageResults;
}

export interface SavedLead {
  id: string;
  created_at: string;
  target_name: string;
  target_role: string;
  lead_data: Opportunity;
  dossier_data: MissionBriefing | null;
  status?: 'inbox' | 'active' | 'closed' | 'archive';
}

// --- FUNCTIONS ---

export const logMission = async (
  user: User | null,
  params: OperationalParameters,
  results: TriageResults
) => {
  if (!user || !user.email) return;

  try {
    const { error } = await supabase.from('mission_logs').insert({
      user_id: user.id,
      user_email: user.email,
      sector: params.sector,
      lane: params.lane,
      result_count: results.leads.length,
      full_results: results
    });

    if (error) console.error('Error logging mission:', error);
  } catch (err) {
    console.error('Critical error logging mission:', err);
  }
};

export const saveTopLead = async (
  user: User | null,
  lead: Opportunity,
  dossier: MissionBriefing | null
) => {
  if (!user || !user.email) throw new Error('User not authenticated');

  const { error } = await supabase.from('saved_leads').insert({
    user_id: user.id,
    user_email: user.email,
    target_name: lead.targetName,
    target_role: lead.pocTitle,
    lead_data: lead,
    dossier_data: dossier,
    status: 'inbox'
  });

  if (error) throw error;
  return { success: true };
};

export const getMissionHistory = async () => {
  const { data, error } = await supabase
    .from('mission_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as MissionLog[];
};

export const archiveLead = async (id: string) => {
  const { error } = await supabase
    .from('saved_leads')
    .update({ status: 'archive' })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const updateLeadStatus = async (leadId: string, newStatus: 'inbox' | 'active' | 'closed' | 'archive') => {
  const { error } = await supabase
    .from('saved_leads')
    .update({ status: newStatus })
    .eq('id', leadId);

  if (error) throw error;
  return { success: true };
};

export const getLeadsByStatus = async (status: string) => {
  const { data, error } = await supabase
    .from('saved_leads')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SavedLead[];
};

// --- NAMED BUCKET FETCHERS (STABILITY PATCH) ---

export const getTopLeads = async () => {
  return getLeadsByStatus('inbox');
};

export const getActiveProjects = async () => {
  // Returns both active and closed-won for the pipeline view
  const { data, error } = await supabase
    .from('saved_leads')
    .select('*')
    .in('status', ['active', 'closed'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SavedLead[];
};

export const getArchivedLeads = async () => {
  return getLeadsByStatus('archive');
};
