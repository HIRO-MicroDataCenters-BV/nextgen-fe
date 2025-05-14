<template>
  <Breadcrumb v-if="breadcrumbs.length > 0">
    <BreadcrumbList>
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
        <BreadcrumbItem>
          <BreadcrumbLink v-if="!crumb.isCurrent" :as-child="true">
            <RouterLink :to="crumb.path">{{ crumb.label }}</RouterLink>
          </BreadcrumbLink>
          <BreadcrumbPage v-else>{{ crumb.label }}</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemType {
  path: string;
  label: string;
  isCurrent: boolean;
}

const route = useRoute();
const { t } = useI18n();

const breadcrumbs = computed<BreadcrumbItemType[]>(() => {
  const pathArray = route.path.split('/').filter(p => p);
  const crumbs: BreadcrumbItemType[] = [];

  let currentPath = '';

  pathArray.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLastSegment = index === pathArray.length - 1;

    let label = '';
    if (segment.toLowerCase() === 'my_catalog') {
      label = t('breadcrumb.my_catalog', 'My Catalog');
    } else if (segment.toLowerCase() === 'marketplace') {
      label = t('breadcrumb.marketplace', 'Marketplace');
    } else if (segment.toLowerCase() === 'create') {
      label = t('breadcrumb.create', 'Create');
    } else if (segment.toLowerCase() === 'edit') {
      label = t('breadcrumb.edit_item', 'Edit Item');
    } else if (route.params.id && segment === route.params.id) {
        if (pathArray[index -1] === 'my_catalog' && pathArray[index +1] === 'edit') {
             label = t('breadcrumb.catalog_item', 'Item Details');
        } else {
            label = segment;
        }
    } else {
      label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }

    crumbs.push({
      path: currentPath,
      label: label,
      isCurrent: isLastSegment,
    });
  });
  return crumbs;
});

</script>

<style scoped>
/* Add any specific styles for your breadcrumbs if needed */
</style> 