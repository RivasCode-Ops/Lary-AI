import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../services/auth';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState('master');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha email e senha');
      return;
    }
    if (isRegistering && !name.trim()) {
      Alert.alert('Campo obrigatório', 'Preencha seu nome');
      return;
    }
    setIsLoading(true);
    try {
      if (isRegistering) {
        await register(name.trim(), email.trim(), password, profile);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro de conexão';
      Alert.alert('Erro', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>LARY</Text>
        <Text style={styles.logoAccent}>AI</Text>
        <Text style={styles.subtitle}>Construção Civil Inteligente</Text>

        <View style={styles.card}>
          {isRegistering && (
            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor="#94a3b8"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@obra.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />
          </View>

          {isRegistering && (
            <View style={styles.field}>
              <Text style={styles.label}>Perfil</Text>
              <View style={styles.profileRow}>
                {['master', 'engineer', 'viewer'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.profileBtn, profile === p && styles.profileBtnActive]}
                    onPress={() => setProfile(p)}
                  >
                    <Text style={[styles.profileText, profile === p && styles.profileTextActive]}>
                      {p === 'master' ? '👷 Mestre' : p === 'engineer' ? '👷‍♂️ Eng.' : '👀 Visitante'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {isRegistering ? 'Criar conta' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsRegistering(!isRegistering)}
          >
            <Text style={styles.toggleText}>
              {isRegistering
                ? 'Já tem conta? Faça login'
                : 'Não tem conta? Cadastre-se'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logo: { fontSize: 48, fontWeight: '700', color: '#fff' },
  logoAccent: { fontSize: 48, fontWeight: '700', color: '#38bdf8', marginTop: -12, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 32 },
  card: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#1e293b', borderRadius: 16,
    padding: 24, borderWidth: 1, borderColor: '#334155',
  },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#334155', borderRadius: 10,
    padding: 14, fontSize: 15, color: '#f1f5f9',
    borderWidth: 1, borderColor: '#475569',
  },
  profileRow: { flexDirection: 'row', gap: 8 },
  profileBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    backgroundColor: '#334155', alignItems: 'center',
  },
  profileBtnActive: { backgroundColor: '#0284c7' },
  profileText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  profileTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#0284c7', padding: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  toggleBtn: { alignItems: 'center', marginTop: 16 },
  toggleText: { fontSize: 13, color: '#38bdf8' },
});
