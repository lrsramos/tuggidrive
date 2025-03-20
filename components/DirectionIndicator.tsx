import { View, StyleSheet } from 'react-native';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react-native';

interface DirectionIndicatorProps {
  direction: 'front' | 'back' | 'left' | 'right';
  variant?: 'light' | 'dark';
}

export function DirectionIndicator({ direction, variant = 'light' }: DirectionIndicatorProps) {
  const color = variant === 'light' ? '#4CAF50' : '#fff';
  
  const getIcon = () => {
    switch (direction) {
      case 'front':
        return <ArrowUp size={20} color={color} />;
      case 'back':
        return <ArrowDown size={20} color={color} />;
      case 'left':
        return <ArrowLeft size={20} color={color} />;
      case 'right':
        return <ArrowRight size={20} color={color} />;
    }
  };

  return (
    <View style={[
      styles.container,
      variant === 'light' ? styles.lightContainer : styles.darkContainer
    ]}>
      {getIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightContainer: {
    backgroundColor: '#f0f9f0',
  },
  darkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});