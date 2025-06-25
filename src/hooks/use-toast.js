import { toast as sonnerToast } from 'sonner'

export function useToast() {
  const toast = ({ title, description, variant = 'default' }) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description: description
      })
    } else {
      sonnerToast.success(title, {
        description: description
      })
    }
  }

  return { toast }
}

