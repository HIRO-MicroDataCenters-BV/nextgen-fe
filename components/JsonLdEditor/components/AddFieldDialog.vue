<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Field</DialogTitle>
        <DialogDescription>
          Select the type of field you want to add
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="field-name">Field Name</Label>
          <Input
            id="field-name"
            v-model="fieldName"
            placeholder="e.g., dcat:title"
          />
        </div>
        
        <div class="space-y-2">
          <Label for="field-type">Field Type</Label>
          <Select v-model="fieldType">
            <SelectTrigger id="field-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="uri">URI</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="language-string">Language String</SelectItem>
              <SelectItem value="object">Object</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="cancel">Cancel</Button>
        <Button type="button" :disabled="!fieldName || !fieldType" @click="confirm">Add Field</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JsonLdNodeType } from '../types/editor.types';

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
