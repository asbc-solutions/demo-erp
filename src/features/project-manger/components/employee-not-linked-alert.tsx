import { Alert, AlertDescription, AlertTitle } from "@/src/shared/components/ui/alert"

export function EmployeeNotLinkedAlert() {
  return (
    <Alert variant="warning">
      <AlertTitle>Your account isn&apos;t linked to an employee</AlertTitle>
      <AlertDescription>
        Personal work data (capacity, priorities, activity, my projects) needs
        an employee profile to resolve. Ask an admin to link this account to
        an employee in Core HR, then refresh this page.
      </AlertDescription>
    </Alert>
  )
}
