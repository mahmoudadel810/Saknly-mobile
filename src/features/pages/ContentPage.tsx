import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';

import type { PageSection } from './usePages';
import { Text } from '@/components/Text';

interface ContentPageProps extends PropsWithChildren {
  title: string;
  intro?: string;
}

/** A scrollable text page: a heading, an intro line, then whatever the page puts below. */
export function ContentPage({ title, intro, children }: ContentPageProps) {
  return (
    <Screen scroll>
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-left text-3xl text-text font-bold">
          {title}
        </Text>
        {intro ? <Text className="text-left text-base text-text-2">{intro}</Text> : null}
      </View>
      {children}
    </Screen>
  );
}

export function Sections({ sections }: { sections: PageSection[] }) {
  return (
    <View className="gap-6">
      {sections.map((section) => (
        <View key={section.title} className="gap-2">
          <Text accessibilityRole="header" className="text-left text-xl text-text font-semibold">
            {section.title}
          </Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-left text-base leading-7 text-text-2">
              {paragraph}
            </Text>
          ))}
          {section.bullets.map((bullet) => (
            <View key={bullet} className="flex-row items-start gap-2">
              <Text className="text-base leading-7 text-primary">•</Text>
              <Text className="flex-1 text-left text-base leading-7 text-text-2">{bullet}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
