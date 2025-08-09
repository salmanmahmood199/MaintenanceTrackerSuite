import { Stack } from 'expo-router';

export default function TicketsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Tickets',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Ticket Details',
          headerShown: true,
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}
