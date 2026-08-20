import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { createPartner, deletePartner, fetchPartners, type PartnerPayload, updatePartner } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Partner } from '@/lib/types';
import { useAuth } from '@/contexts/auth';

export default function PartnersScreen() {
  const { profile } = useAuth();
  if (profile?.role === 'admin') return <AdminPartnersScreen />;
  return <StudentPartnersScreen />;
}

function StudentPartnersScreen() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPartners(await fetchPartners());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os parceiros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);

  return <SafeAreaView style={styles.safeArea} edges={['top']}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.header}><Text style={styles.eyebrow}>COMUNIDADE JUNGLE</Text><Text style={styles.title}>Parceiros Jungle</Text><Text style={styles.subtitle}>Beneficios especiais de empresas que treinam com a nossa comunidade.</Text></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" onPress={load} style={styles.refresh}><Text style={styles.refreshText}>Atualizar</Text></Pressable>
    {loading ? <ActivityIndicator color="#D7262E" /> : partners.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Novos beneficios em breve</Text><Text style={styles.emptyText}>A academia esta preparando a vitrine dos parceiros para a comunidade Jungle.</Text></View> : <View style={styles.list}>{partners.map((partner) => <PartnerCard key={partner.id} partner={partner} />)}</View>}
  </ScrollView></SafeAreaView>;
}

const emptyPayload = (): PartnerPayload => ({ name: '', slug: '', category: '', description: '', logo_url: null, cover_url: null, gallery_urls: [], benefit_title: '', benefit_description: '', coupon_code: null, whatsapp_url: null, instagram_url: null, website_url: null, address: null, is_featured: false, is_active: true, display_order: 0, valid_until: null });

function AdminPartnersScreen() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [form, setForm] = useState<PartnerPayload>(emptyPayload);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => { setLoading(true); setError(null); try { setPartners(await fetchPartners()); } catch (e) { setError(e instanceof Error ? e.message : 'Nao foi possivel carregar os parceiros.'); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  const set = <K extends keyof PartnerPayload>(key: K, value: PartnerPayload[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toSlug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const openCreate = () => { setEditing(null); setForm(emptyPayload()); setShowForm(true); };
  const openEdit = (partner: Partner) => { const { id, created_at, updated_at, ...payload } = partner; setEditing(partner); setForm(payload); setShowForm(true); };

  async function chooseImage(kind: 'logo' | 'cover' | 'gallery') {
    if (!supabase) return;
    const client = supabase;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Permissao para acessar fotos foi negada.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: kind === 'gallery', quality: 0.82, selectionLimit: kind === 'gallery' ? Math.max(1, 6 - form.gallery_urls.length) : 1 });
    if (result.canceled) return;
    try {
      const urls = await Promise.all(result.assets.map(async (asset) => {
        const ext = asset.mimeType?.split('/')[1] || asset.uri.split('?')[0].split('.').pop() || 'jpg';
        const response = await fetch(asset.uri);
        const bytes = await response.arrayBuffer();
        const path = `partners/${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await client.storage.from('partner-media').upload(path, bytes, { contentType: asset.mimeType ?? `image/${ext}` });
        if (uploadError) throw uploadError;
        return client.storage.from('partner-media').getPublicUrl(path).data.publicUrl;
      }));
      if (kind === 'logo') set('logo_url', urls[0] ?? null); else if (kind === 'cover') set('cover_url', urls[0] ?? null); else set('gallery_urls', [...form.gallery_urls, ...urls].slice(0, 6));
    } catch (e) { setError(e instanceof Error ? e.message : 'Nao foi possivel enviar a imagem.'); }
  }

  async function save() {
    if (!form.name.trim() || !form.category.trim() || !form.slug.trim()) { setError('Nome, categoria e identificador sao obrigatorios.'); return; }
    setSaving(true); setError(null);
    try { if (editing) await updatePartner(editing.id, form); else await createPartner(form); setShowForm(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Nao foi possivel salvar o parceiro.'); } finally { setSaving(false); }
  }
  function remove(partner: Partner) { Alert.alert('Excluir parceiro', `Excluir ${partner.name}? As imagens enviadas nao serao apagadas automaticamente.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: async () => { try { await deletePartner(partner.id); await load(); } catch { setError('Nao foi possivel excluir o parceiro.'); } } }]); }

  return <SafeAreaView style={styles.safeArea} edges={['top']}><ScrollView contentContainerStyle={styles.container}><View style={styles.header}><Text style={styles.eyebrow}>ADMINISTRACAO</Text><Text style={styles.title}>Parceiros Jungle</Text><Text style={styles.subtitle}>Cadastre e controle a vitrine da comunidade.</Text></View>{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={openCreate} style={styles.primaryWide}><Text style={styles.primaryText}>Novo parceiro</Text></Pressable>{loading ? <ActivityIndicator color="#D7262E" /> : partners.map((partner) => <View key={partner.id} style={styles.adminRow}><View style={styles.identityText}><Text style={styles.name}>{partner.name}</Text><Text style={styles.category}>{partner.category} · {partner.is_active ? 'Ativo' : 'Inativo'}</Text></View><Pressable onPress={() => openEdit(partner)} style={styles.smallButton}><Text style={styles.secondaryText}>Editar</Text></Pressable><Pressable onPress={() => remove(partner)} style={styles.smallButton}><Text style={styles.dangerText}>Excluir</Text></Pressable></View>)}{showForm ? <View style={styles.form}><Text style={styles.formTitle}>{editing ? 'Editar parceiro' : 'Novo parceiro'}</Text><FormInput label="Nome *" value={form.name} onChangeText={(v) => { set('name', v); if (!editing) set('slug', toSlug(v)); }} /><FormInput label="Categoria *" value={form.category} onChangeText={(v) => set('category', v)} /><FormInput label="Identificador *" value={form.slug} onChangeText={(v) => set('slug', toSlug(v))} /><FormInput label="Descricao" value={form.description} onChangeText={(v) => set('description', v)} multiline /><FormInput label="Titulo do beneficio" value={form.benefit_title} onChangeText={(v) => set('benefit_title', v)} /><FormInput label="Detalhes do beneficio" value={form.benefit_description} onChangeText={(v) => set('benefit_description', v)} multiline /><FormInput label="Cupom" value={form.coupon_code ?? ''} onChangeText={(v) => set('coupon_code', v || null)} /><FormInput label="WhatsApp" value={form.whatsapp_url ?? ''} onChangeText={(v) => set('whatsapp_url', v || null)} /><FormInput label="Instagram" value={form.instagram_url ?? ''} onChangeText={(v) => set('instagram_url', v || null)} /><FormInput label="Site" value={form.website_url ?? ''} onChangeText={(v) => set('website_url', v || null)} /><FormInput label="Endereco" value={form.address ?? ''} onChangeText={(v) => set('address', v || null)} /><FormInput label="Valido ate (AAAA-MM-DD)" value={form.valid_until ?? ''} onChangeText={(v) => set('valid_until', v || null)} /><FormInput label="Ordem" value={String(form.display_order)} onChangeText={(v) => set('display_order', Number(v) || 0)} /><View style={styles.actions}><Pressable onPress={() => chooseImage('logo')} style={styles.secondaryButton}><Text style={styles.secondaryText}>Logo</Text></Pressable><Pressable onPress={() => chooseImage('cover')} style={styles.secondaryButton}><Text style={styles.secondaryText}>Capa</Text></Pressable><Pressable onPress={() => chooseImage('gallery')} style={styles.secondaryButton}><Text style={styles.secondaryText}>Galeria</Text></Pressable></View><Toggle label="Parceiro ativo" value={form.is_active} onPress={() => set('is_active', !form.is_active)} /><Toggle label="Em destaque" value={form.is_featured} onPress={() => set('is_featured', !form.is_featured)} /><View style={styles.actions}><Pressable onPress={() => setShowForm(false)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar</Text></Pressable><Pressable disabled={saving} onPress={save} style={styles.primaryButton}><Text style={styles.primaryText}>{saving ? 'Salvando...' : 'Salvar'}</Text></Pressable></View></View> : null}</ScrollView></SafeAreaView>;
}

function FormInput({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) { return <View style={styles.inputGroup}><Text style={styles.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} multiline={multiline} textAlignVertical="top" style={[styles.input, multiline && styles.textArea]} placeholderTextColor="#9CA3AF" /></View>; }
function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.toggle}><Text style={styles.inputLabel}>{label}</Text><Text style={value ? styles.toggleOn : styles.toggleOff}>{value ? 'Sim' : 'Nao'}</Text></Pressable>; }

function PartnerCard({ partner }: { partner: Partner }) {
  async function open(url: string | null) { if (!url) return; try { await Linking.openURL(url); } catch {} }
  return <View style={styles.card}>
    {partner.cover_url ? <Image source={{ uri: partner.cover_url }} style={styles.cover} /> : null}
    <View style={styles.body}><View style={styles.identity}>{partner.logo_url ? <Image source={{ uri: partner.logo_url }} style={styles.logo} /> : <View style={styles.logoFallback}><Text style={styles.logoText}>{partner.name[0]}</Text></View>}<View style={styles.identityText}><Text style={styles.name}>{partner.name}</Text><Text style={styles.category}>{partner.category}</Text></View>{partner.is_featured ? <Text style={styles.featured}>DESTAQUE</Text> : null}</View>
    {partner.benefit_title ? <View style={styles.benefit}><Text style={styles.benefitTitle}>{partner.benefit_title}</Text>{partner.benefit_description ? <Text style={styles.benefitDescription}>{partner.benefit_description}</Text> : null}{partner.coupon_code ? <Text style={styles.coupon}>CUPOM: {partner.coupon_code}</Text> : null}</View> : null}
    <Text style={styles.description}>{partner.description}</Text>{partner.address ? <Text style={styles.address}>{partner.address}</Text> : null}
    <View style={styles.actions}>{partner.whatsapp_url ? <Pressable style={styles.primaryButton} onPress={() => open(partner.whatsapp_url)}><Text style={styles.primaryText}>WhatsApp</Text></Pressable> : null}{partner.instagram_url ? <Pressable style={styles.secondaryButton} onPress={() => open(partner.instagram_url)}><Text style={styles.secondaryText}>Instagram</Text></Pressable> : null}{partner.website_url ? <Pressable style={styles.secondaryButton} onPress={() => open(partner.website_url)}><Text style={styles.secondaryText}>Site</Text></Pressable> : null}</View></View>
  </View>;
}

const styles = StyleSheet.create({ safeArea:{flex:1,backgroundColor:'#111111'},container:{flexGrow:1,gap:18,paddingHorizontal:24,paddingBottom:34,paddingTop:18},header:{gap:6,backgroundColor:'#111111'},eyebrow:{color:'#D7262E',fontWeight:'800',fontSize:12},title:{color:'#FFF',fontSize:30,fontWeight:'800'},subtitle:{color:'#9CA3AF',fontSize:15,lineHeight:21},refresh:{height:48,alignItems:'center',justifyContent:'center',borderRadius:8,borderWidth:1,borderColor:'#D7262E',backgroundColor:'#FFF'},refreshText:{color:'#D7262E',fontSize:16,fontWeight:'800'},error:{color:'#FCA5A5',fontSize:14},empty:{gap:8,borderRadius:8,padding:20,backgroundColor:'#FFF'},emptyTitle:{color:'#151515',fontSize:18,fontWeight:'800'},emptyText:{color:'#6B7280',fontSize:14,lineHeight:20},list:{gap:14,backgroundColor:'#111111'},card:{overflow:'hidden',borderRadius:8,backgroundColor:'#FFF'},cover:{width:'100%',height:150},body:{gap:13,padding:16,backgroundColor:'#FFF'},identity:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#FFF'},logo:{width:48,height:48,borderRadius:8},logoFallback:{width:48,height:48,borderRadius:8,alignItems:'center',justifyContent:'center',backgroundColor:'#D7262E'},logoText:{color:'#FFF',fontSize:20,fontWeight:'800'},identityText:{flex:1,gap:2,backgroundColor:'#FFF'},name:{color:'#151515',fontSize:18,fontWeight:'800'},category:{color:'#6B7280',fontSize:13},featured:{color:'#D7262E',fontSize:10,fontWeight:'800'},benefit:{gap:4,borderLeftWidth:4,borderLeftColor:'#D7262E',paddingLeft:10,backgroundColor:'#F3F4F6'},benefitTitle:{color:'#151515',fontSize:15,fontWeight:'800'},benefitDescription:{color:'#4B5563',fontSize:13,lineHeight:18},coupon:{color:'#D7262E',fontSize:12,fontWeight:'800'},description:{color:'#4B5563',fontSize:14,lineHeight:20},address:{color:'#6B7280',fontSize:13},actions:{flexDirection:'row',gap:8,backgroundColor:'#FFF'},primaryButton:{flex:1,minHeight:42,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:'#D7262E'},primaryWide:{minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:'#D7262E'},primaryText:{color:'#FFF',fontWeight:'800',fontSize:13},secondaryButton:{flex:1,minHeight:42,alignItems:'center',justifyContent:'center',borderRadius:8,borderWidth:1,borderColor:'#D7262E',backgroundColor:'#FFF'},secondaryText:{color:'#D7262E',fontWeight:'800',fontSize:13},dangerText:{color:'#B91C1C',fontWeight:'800',fontSize:13},adminRow:{flexDirection:'row',alignItems:'center',gap:8,borderRadius:8,padding:14,backgroundColor:'#FFF'},smallButton:{minHeight:38,alignItems:'center',justifyContent:'center',paddingHorizontal:8,borderWidth:1,borderColor:'#E5E7EB',borderRadius:8,backgroundColor:'#FFF'},form:{gap:12,borderRadius:8,padding:16,backgroundColor:'#FFF'},formTitle:{color:'#151515',fontSize:19,fontWeight:'800'},inputGroup:{gap:5,backgroundColor:'#FFF'},inputLabel:{color:'#374151',fontSize:13,fontWeight:'800'},input:{minHeight:46,borderWidth:1,borderColor:'#E5E7EB',borderRadius:8,paddingHorizontal:12,color:'#151515',fontSize:15,backgroundColor:'#FFF'},textArea:{minHeight:90,paddingTop:10},toggle:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:42,paddingHorizontal:12,borderRadius:8,backgroundColor:'#F3F4F6'},toggleOn:{color:'#15803D',fontWeight:'800'},toggleOff:{color:'#6B7280',fontWeight:'800'} });
