import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import CameraPage from './src/pages/CameraPage.js';
import LoginPage from './src/pages/LoginPage.js';

const AppNavigator = createStackNavigator(
  {
    'Login': {
      screen: LoginPage,
      navigationOptions: {
        headerShown: false,
      }
    },
    'Camera': {
      screen: CameraPage,
      navigationOptions: {
        title: 'Camera',
        headerTitleStyle: {
          textAlign: 'center',
          fontSize: 20,
        },
      }
    },
  },
  {
    defaultNavigationOptions: {
      title: 'HardwareAccess',
      headerTintColor: 'white',
      headerStyle: {
        backgroundColor: '#6542f4',
        borderBottomColor: '#f4f2ff',
      },
      headerTitleStyle: {
        color: 'white',
        fontSize: 40,
        flexGrow: 1,
        textAlign: 'center',
      }
    }
  }
);

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;