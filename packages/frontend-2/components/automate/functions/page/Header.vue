<template>
  <div>
    <div
      class="pt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <Portal to="navigation">
        <HeaderNavLink
          :to="automationFunctionsRoute"
          :name="'Automate Functions'"
        ></HeaderNavLink>
      </Portal>

      <h1 class="h3 font-bold">Automate Functions</h1>
      <div class="flex flex-col sm:flex-row gap-2">
        <FormTextInput
          name="search"
          placeholder="Search Functions"
          show-clear
          :model-value="bind.modelValue.value"
          color="foundation"
          v-on="on"
        />
        <FormButton
          v-if="canCreateFunction && false"
          :icon-left="PlusIcon"
          @click="() => (createDialogOpen = true)"
        >
          New Function
        </FormButton>
      </div>
    </div>
    <AutomateFunctionCreateDialog
      v-model:open="createDialogOpen"
      :is-authorized="!!activeUser?.automateInfo.hasAutomateGithubApp"
      :github-orgs="activeUser?.automateInfo.availableGithubOrgs || []"
      :templates="availableTemplates"
    />
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import type { Nullable, Optional } from '@speckle/shared'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionsPageHeader_QueryFragment } from '~/lib/common/generated/gql/graphql'
import { automationFunctionsRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment AutomateFunctionsPageHeader_Query on Query {
    activeUser {
      id
      automateInfo {
        hasAutomateGithubApp
        availableGithubOrgs
      }
    }
    serverInfo {
      automate {
        availableFunctionTemplates {
          ...AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplate
        }
      }
    }
  }
`)

const props = defineProps<{
  activeUser: Optional<AutomateFunctionsPageHeader_QueryFragment['activeUser']>
  serverInfo: Optional<AutomateFunctionsPageHeader_QueryFragment['serverInfo']>
}>()
const {
  public: { automateGhClientId }
} = useRuntimeConfig()
const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
const { triggerNotification } = useGlobalToast()
const route = useRoute()
const router = useRouter()

const createDialogOpen = ref(false)

const availableTemplates = computed(
  () => props.serverInfo?.automate.availableFunctionTemplates || []
)
const canCreateFunction = computed(
  () =>
    !!props.activeUser?.id &&
    !!automateGhClientId.length &&
    !!availableTemplates.value.length
)

if (process.client) {
  watch(
    () => route.query['ghAuth'] as Nullable<string>,
    (ghAuthVal) => {
      if (!ghAuthVal?.length) return

      if (ghAuthVal === 'success') {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'GitHub authorization successful'
        })
        createDialogOpen.value = true
      } else if (ghAuthVal === 'access_denied') {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'GitHub authorization failed',
          description:
            "You've explicitly denied access to your GitHub account. Please try again."
        })
      } else {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'GitHub authorization failed',
          description:
            (route.query['ghAuthDesc'] as Nullable<string>) ||
            'An unknown issue occurred'
        })
      }

      void router.replace({ query: {} })
    },
    { immediate: true }
  )
}
</script>