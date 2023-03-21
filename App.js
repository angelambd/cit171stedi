import React, { useEffect, useState, } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity,TextInput, Button, Alert } from 'react-native';
import  Navigation from './components/Navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from './screens/OnboardingScreen';
import Home from './screens/Home';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';



const AppStack = createNativeStackNavigator();
const loggedInStates={
  NOT_LOGGED_IN:'NOT_LOGGED_IN',
  LOGGED_IN:'LOGGED_IN',
  LOGGING_IN:'LOGGING_IN'
}

const App = () =>{ //arrow function
  const [isFirstLaunch, setFirstLaunch] = React.useState(true);
  const [loggedInState,setLoggedInState] = React.useState(loggedInStates.NOT_LOGGED_IN);
  const [phoneNumber,setPhoneNumber] = React.useState("");
  const [oneTimePassword, setOneTimePassword] = React.useState("");
  const [homeTodayScore, setHomeTodayScore] = React.useState(0);
  const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = React.useState(false);

useEffect(() => {
  (async() => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricEnrolled(enrolled);
  })();
});


  useEffect(()=>{//this is code that has to run before we show app screen
   const getSessionToken = async()=>{
    const sessionToken = await AsyncStorage.getItem('sessionToken');
    console.log('sessionToken',sessionToken);
    const validateResponse = await fetch('https://dev.stedi.me/validate/'+ sessionToken,
    {
      method:'GET',
      headers:{
        'content-type':'application/text'
      }
    }    
    );    

    if(validateResponse.status==200){//we know it is a good non-expired token
      const userName = await validateResponse.text();
      await AsyncStorage.setItem('userName',userName);//save user name for later
      setLoggedInState(loggedInStates.LOGGED_IN);//if token's bad it will skip this
    }
   }
   getSessionToken();
  });

   if (isFirstLaunch == true && loggedInState!=loggedInStates.LOGGED_IN){
return(
  <OnboardingScreen setFirstLaunch={setFirstLaunch}/>
 
);
  } else if(loggedInState==loggedInStates.LOGGED_IN){
    return <Navigation setLoggedInState={setLoggedInState}/>
  } else if(loggedInState==loggedInStates.NOT_LOGGED_IN){
    return (
      <View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.text}> {isBiometricSupported ? 'Your device is compatible with Biometrics'
        : 'Your device is not compatible with Biometrics'}
        </Text>
        <Text style={styles.text}> {isBiometricEnrolled ? 'Your have a saved fingerprint or face biometric'
        : 'You have not saved a fingerprint or face biometric'}
        </Text>

        <TextInput 
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}  
          placeholderTextColor='#613659' 
          placeholder='Cell Phone'>          
        </TextInput>
        
        <Button
          title='Biometric Authentication'
          style={styles.button}
          onPress={async ()=>{
            const biometricAuth = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Login with Biometrics',
              disableDeviceFallBack: true,
              cancelLabel: 'Cancel'
            })
            console.log("biometric Auth", biometricAuth)
          }}
        ></Button>
        
        
        <Button
          title='Send'
          style={styles.button}
          onPress={async ()=>{
            console.log(phoneNumber+' Button was pressed')

            await fetch(
              'https://dev.stedi.me/twofactorlogin/'+phoneNumber,
              {
                method:'POST',
                headers:{
                 'content-type':'application/text'
               }
              }
            )
            setLoggedInState(loggedInStates.LOGGING_IN);
          }}
        />      
      </View>
    )
  } else if(loggedInState==loggedInStates.LOGGING_IN){
    return (
      <View>
      <TextInput 
        value={oneTimePassword}
        onChangeText={setOneTimePassword}
        style={styles.input}  
        placeholderTextColor='#613659' 
        placeholder='One Time Password'   
        keyboardType='numeric'>
      </TextInput>
      <Button
          title='Login'
          style={styles.button}
          onPress={async ()=>{
            console.log(phoneNumber+' Button was pressed')

            const loginResponse=await fetch(
              'https://dev.stedi.me/twofactorlogin',
              {
                method:'POST',
                headers:{
                 'content-type':'application/text'
                },
                body:JSON.stringify({
                  phoneNumber,
                  oneTimePassword
                }
                )
              }
            )
            if(loginResponse.status==200){//200 means the password was valid

              const sessionToken = await loginResponse.text();
              console.log('sessionToken in Login Button',sessionToken);
              await AsyncStorage.setItem('sessionToken',sessionToken);//local storage
              setLoggedInState(loggedInStates.LOGGED_IN);
            } else{
              console.log('response status',loginReponse.status);
              Alert.alert('Invalid','Invalid Login information')
              setLoggedInState(NOT_LOGGED_IN);
            }
          }}
        />        

      </View>
    )
  }
}
 export default App;

 
 const styles = StyleSheet.create({
     container:{
         flex:1, 
         alignItems:'center',
         justifyContent: 'center'
     },
     input: {
       height: 50,
       marginTop: 100,
       borderWidth: 1,
       padding: 10,
     },
     margin:{
       marginTop:100
     },
     button: {
       alignItems: "center",
       backgroundColor: "#DDDDDD",
       padding: 10,
     },
     title:{
      textAlign:"center",
      marginTop:80,
      marginBottom:-50,
      fontSize: 35,
      color:'#C197D2',
      fontWeight: 'bold'
     },
     text:{
      marginTop:60,
      marginBottom:-55,
      fontSize: 15,
     }
 });
