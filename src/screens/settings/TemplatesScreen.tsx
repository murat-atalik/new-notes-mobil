import React from 'react';
import { View } from 'react-native';
import { LayoutTemplate, ListPlus, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react-native';

import {
  Card,
  confirmAction,
  EmptyState,
  IconButton,
  IconTile,
  ListGroup,
  palette,
  Row,
  showActionSheet,
  showToast,
  StackScreen,
  Text,
} from '../../design';
import { tw } from '../../lib/tw';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../store/useAppStore';
import type { ListTemplate } from '../../types';
import { LIST_TYPE_OPTIONS } from './listTypes';
import { templateTileProps } from './templateIcon';

export const TemplatesScreen: React.FC<RootScreenProps<'Templates'>> = ({ navigation }) => {
  const templates = useAppStore((s) => s.templates);
  const deleteTemplate = useAppStore((s) => s.deleteTemplate);
  const createListFromTemplate = useAppStore((s) => s.createListFromTemplate);
  const isSyncing = useAppStore((s) => s.isSyncing);
  const syncWithServer = useAppStore((s) => s.syncWithServer);

  const createList = (template: ListTemplate) => {
    const listId = createListFromTemplate(template.id);
    if (!listId) {
      showToast('Liste oluşturulamadı', 'error');
      return;
    }
    showToast(`"${template.title}" listesi oluşturuldu`);
    navigation.navigate('ListDetail', { listId });
  };

  const askDelete = (template: ListTemplate) =>
    confirmAction({
      title: `"${template.title}" silinsin mi?`,
      message: 'Bu şablondan oluşturulan listeler etkilenmez.',
      onConfirm: () => {
        deleteTemplate(template.id);
        showToast('Şablon silindi');
      },
    });

  const openActions = (template: ListTemplate) =>
    showActionSheet({
      title: template.title,
      options: [
        { label: 'Bu şablonla liste oluştur', icon: ListPlus, onPress: () => createList(template) },
        { label: 'Düzenle', icon: Pencil, onPress: () => navigation.navigate('TemplateForm', { templateId: template.id }) },
        { label: 'Sil', icon: Trash2, destructive: true, onPress: () => askDelete(template) },
      ],
    });

  const addButton = (
    <IconButton icon={Plus} label="Şablon ekle" variant="plain" color={palette.brand} onPress={() => navigation.navigate('TemplateForm')} />
  );

  return (
    <StackScreen title="Şablonlar" right={addButton} refreshing={isSyncing} onRefresh={() => syncWithServer(false)}>
      <Card className="flex-row items-center gap-3">
        <IconTile icon={LayoutTemplate} color="#f59e0b" />
        <View style={tw`flex-1 min-w-0`}>
          <Text variant="subhead" weight="semibold">
            Sık kullandığın listeleri şablona çevir
          </Text>
          <Text variant="footnote" tone="muted">
            Haftalık market, bebek çantası, tatil hazırlığı… Tek dokunuşla yeni liste oluştur.
          </Text>
        </View>
      </Card>

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Henüz şablon yok"
          message="Tekrar eden listelerin için bir şablon oluştur, her seferinde baştan yazma."
          action={{ label: 'Şablon Oluştur', icon: Plus, onPress: () => navigation.navigate('TemplateForm') }}
        />
      ) : (
        LIST_TYPE_OPTIONS.map((opt) => {
          const group = templates.filter((t) => t.type === opt.value);
          if (group.length === 0) return null;
          return (
            <ListGroup key={opt.value} header={opt.label}>
              {group.map((template) => (
                <Row
                  key={template.id}
                  title={template.title}
                  subtitle={`${template.items.length} ${opt.value === 'SHOPPING' ? 'ürün' : opt.value === 'TODO' ? 'görev' : 'not'}${template.description ? ` · ${template.description}` : ''}`}
                  left={<IconTile {...templateTileProps(template.icon)} color={template.color || palette.brandLight} size="sm" />}
                  onPress={() => navigation.navigate('TemplateForm', { templateId: template.id })}
                  onLongPress={() => openActions(template)}
                  chevron={false}
                  right={<IconButton icon={MoreHorizontal} label="Seçenekler" variant="plain" onPress={() => openActions(template)} />}
                />
              ))}
            </ListGroup>
          );
        })
      )}
    </StackScreen>
  );
};
