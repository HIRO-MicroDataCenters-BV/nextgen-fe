<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('jsonld.editor.addFieldDialog.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('jsonld.editor.addFieldDialog.description') }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="field-name">{{ t('jsonld.editor.addFieldDialog.fieldName') }}</Label>
          <Input
            id="field-name"
            v-model="fieldName"
            :placeholder="t('jsonld.editor.addFieldDialog.fieldNamePlaceholder')"
          />
        </div>
        
        <div class="space-y-2">
          <Label for="field-type">{{ t('jsonld.editor.addFieldDialog.fieldType') }}</Label>
          <Select v-model="fieldType">
            <SelectTrigger id="field-type">
              <SelectValue :placeholder="t('jsonld.editor.addFieldDialog.selectTypePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">{{ t('jsonld.editor.addFieldDialog.types.string') }}</SelectItem>
              <SelectItem value="uri">{{ t('jsonld.editor.addFieldDialog.types.uri') }}</SelectItem>
              <SelectItem value="date">{{ t('jsonld.editor.addFieldDialog.types.date') }}</SelectItem>
              <SelectItem value="number">{{ t('jsonld.editor.addFieldDialog.types.number') }}</SelectItem>
              <SelectItem value="boolean">{{ t('jsonld.editor.addFieldDialog.types.boolean') }}</SelectItem>
              <SelectItem value="language-string">{{ t('jsonld.editor.addFieldDialog.types.languageString') }}</SelectItem>
              <SelectItem value="object">{{ t('jsonld.editor.addFieldDialog.types.object') }}</SelectItem>
              <SelectItem value="array">{{ t('jsonld.editor.addFieldDialog.types.array') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="cancel">{{ t('jsonld.editor.addFieldDialog.cancel') }}</Button>
        <Button type="button" :disabled="!fieldName || !fieldType" @click="confirm">{{ t('jsonld.editor.addFieldDialog.confirm') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JsonLdNodeType } from '../types/editor.types';

const { t } = useI18n();

interface Props {
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [fieldName: string, fieldType: JsonLdNodeType];
}>();

const isOpen = ref(props.open);
const fieldName = ref('');
const fieldType = ref<JsonLdNodeType | ''>('');

watch(() => props.open, (newVal) => {
  isOpen.value = newVal;
  if (newVal) {
    // Reset form when dialog opens
    fieldName.value = '';
    fieldType.value = '';
  }
});

watch(isOpen, (newVal) => {
  emit('update:open', newVal);
});

const cancel = () => {
  isOpen.value = false;
};

const confirm = () => {
  if (fieldName.value && fieldType.value) {
    emit('confirm', fieldName.value, fieldType.value as JsonLdNodeType);
    isOpen.value = false;
  }
};
</script>
