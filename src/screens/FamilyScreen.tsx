import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';

import { fetchFamilyMembers } from '../services/apiClient';
import type { User } from '../types';
import { strings } from '../strings/tr';
import { styles } from './styles';

export function FamilyScreen({ user }: { user: User; onUserChange?: (user: User) => void }) {
  const [members, setMembers] = useState<User[]>([]);
  const [code, setCode] = useState('');
  useEffect(() => {
    fetchFamilyMembers()
      .then(setMembers)
      .catch((error: unknown) => {
        Alert.alert(
          strings.common.error,
          error instanceof Error ? error.message : strings.common.error,
        );
      });
  }, []);
  const familyMembers = members.filter(
    (member) => member.id === user.id || member.familyId === user.familyId,
  );
  return (
    <SafeAreaView style={styles.safeScreen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{user.familyName ?? strings.family.title}</Text>
        <Text style={styles.lead}>
          {strings.family.familyCode}: {user.familyCode ?? '—'}
        </Text>
        <Text style={styles.subtitle}>
          {strings.family.members} ({familyMembers.length})
        </Text>
        {familyMembers.map((member) => (
          <Text key={member.id} style={styles.lead}>
            {member.name} · @{member.username}
          </Text>
        ))}
        <View style={styles.card}>
          <TextInput
            placeholder={strings.family.joinPlaceholder}
            value={code}
            onChangeText={setCode}
            style={styles.input}
          />
          <Button
            title={strings.family.join}
            onPress={() => Alert.alert(strings.common.error, strings.family.noFamily)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
