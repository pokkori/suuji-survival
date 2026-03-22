import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function scheduleDailyReminderAsync(): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '今日の数字サバイバル',
        body: '昨日のスコアを超えられるか？挑戦しよう！',
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
  } catch (e) {}
}
