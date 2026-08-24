import React, { useEffect, useState } from "react";

import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

/* =====================================================
   API CONFIGURATION
===================================================== */
const API_URL = "http://192.168.0.188/hostel_api/api.php";  // ✅ UPDATED!

/* =====================================================
   COLORS
===================================================== */

const COLORS = {
  primary: "#0B5D8A",
  primaryDark: "#083F5C",
  secondary: "#12A4D9",
  background: "#F4F7FA",
  white: "#FFFFFF",
  text: "#17202A",
  muted: "#6B7280",
  border: "#D8E0E8",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  card: "#FFFFFF",
};



/* =====================================================
   MAIN APP
===================================================== */

export default function Index() {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);


  async function loadUser() {

    try {

      const savedUser = await AsyncStorage.getItem("hostel_user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }
  }


  async function loginUser(userData) {

    await AsyncStorage.setItem(
      "hostel_user",
      JSON.stringify(userData)
    );

    setUser(userData);
  }


  async function logout() {

    await AsyncStorage.removeItem("hostel_user");

    setUser(null);
  }


  if (loading) {

    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading Hostel Complaint System...
        </Text>
      </View>
    );
  }


  if (!user) {

    return (
      <AuthScreen
        onLogin={loginUser}
      />
    );
  }


  if (user.role === "admin") {

    return (
      <AdminDashboard
        user={user}
        onLogout={logout}
      />
    );
  }


  return (
    <StudentDashboard
      user={user}
      onLogout={logout}
    />
  );
}


/* =====================================================
   AUTH SCREEN
===================================================== */

function AuthScreen({ onLogin }) {

  const [mode, setMode] = useState("login");

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  async function submit() {

    if (mode === "register") {

      if (!fullName || !email || !password) {

        Alert.alert(
          "Required",
          "Please complete all required fields."
        );

        return;
      }

    } else {

      if (!email || !password) {

        Alert.alert(
          "Required",
          "Enter your email and password."
        );

        return;
      }
    }


    setLoading(true);


    try {

      const formData = new FormData();

      formData.append(
        "action",
        mode === "login" ? "login" : "register"
      );

      if (mode === "register") {

        formData.append(
          "full_name",
          fullName
        );

        formData.append(
          "room_no",
          roomNo
        );
      }

      formData.append(
        "email",
        email.trim()
      );

      formData.append(
        "password",
        password
      );


      const response = await fetch(
        API_URL,
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();


      if (!data.success) {

        Alert.alert(
          "Error",
          data.message || "Request failed."
        );

        return;
      }


      if (mode === "register") {

        Alert.alert(
          "Success",
          "Account created successfully. Please login."
        );

        setMode("login");

        setPassword("");

      } else {

        await onLogin(data.user);

      }

    } catch (error) {

      Alert.alert(
        "Connection Error",
        "Cannot connect to the server.\n\nMake sure XAMPP is running and your phone is connected to the same Wi-Fi as the computer."
      );

    } finally {

      setLoading(false);

    }
  }


  return (

    <SafeAreaView style={styles.authContainer}>

      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        style={{ flex: 1 }}
      >

        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>
              🏠
            </Text>
          </View>


          <Text style={styles.appTitle}>
            Hostel Complaint
          </Text>

          <Text style={styles.appSubtitle}>
            Complaint & Feedback Management System
          </Text>


          <View style={styles.authCard}>

            <Text style={styles.authTitle}>
              {mode === "login"
                ? "Welcome Back"
                : "Create Account"}
            </Text>


            {mode === "register" && (

              <>
                <Text style={styles.label}>
                  Full Name
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                />


                <Text style={styles.label}>
                  Room Number
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="e.g. B12"
                  value={roomNo}
                  onChangeText={setRoomNo}
                />
              </>
            )}


            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />


            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />


            <Pressable
              style={styles.primaryButton}
              onPress={submit}
              disabled={loading}
            >

              {loading ? (

                <ActivityIndicator
                  color="#fff"
                />

              ) : (

                <Text style={styles.buttonText}>
                  {mode === "login"
                    ? "LOGIN"
                    : "REGISTER"}
                </Text>
              )}

            </Pressable>


            <Pressable
              style={styles.switchButton}
              onPress={() =>
                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                )
              }
            >

              <Text style={styles.switchText}>
                {mode === "login"
                  ? "Don't have an account? Register"
                  : "Already have an account? Login"}
              </Text>

            </Pressable>

          </View>

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}


/* =====================================================
   STUDENT DASHBOARD
===================================================== */

function StudentDashboard({ user, onLogout }) {

  const [page, setPage] = useState("home");

  const [complaints, setComplaints] = useState([]);

  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {

    loadComplaints();

  }, []);


  async function loadComplaints() {

    setRefreshing(true);

    try {

      const formData = new FormData();

      formData.append(
        "action",
        "get_complaints"
      );

      formData.append(
        "user_id",
        String(user.id)
      );

      formData.append(
        "role",
        "student"
      );


      const response = await fetch(
        API_URL,
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();


      if (data.success) {

        setComplaints(
          data.complaints || []
        );
      }

    } catch (error) {

      console.log(error);

    } finally {

      setRefreshing(false);

    }
  }


  function navigate(nextPage) {

    setPage(nextPage);

    if (
      nextPage === "complaints" ||
      nextPage === "home" ||
      nextPage === "notifications"
    ) {

      loadComplaints();
    }
  }


  async function submitComplaint(
    title,
    category,
    description,
    image
  ) {

    try {

      const formData = new FormData();

      formData.append(
        "action",
        "submit_complaint"
      );

      formData.append(
        "user_id",
        String(user.id)
      );

      formData.append(
        "title",
        title
      );

      formData.append(
        "category",
        category
      );

      formData.append(
        "description",
        description
      );


      if (image) {

        formData.append(
          "image",
          {
            uri: image,
            name: "complaint.jpg",
            type: "image/jpeg",
          }
        );
      }


      const response = await fetch(
        API_URL,
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();


      if (data.success) {

        Alert.alert(
          "Success",
          "Your complaint has been submitted."
        );

        await loadComplaints();

        setPage("complaints");

      } else {

        Alert.alert(
          "Error",
          data.message
        );
      }

    } catch (error) {

      Alert.alert(
        "Error",
        "Could not connect to the server."
      );
    }
  }


  async function submitFeedback(
    complaintId,
    rating,
    comment
  ) {

    try {

      const formData = new FormData();

      formData.append(
        "action",
        "submit_feedback"
      );

      formData.append(
        "user_id",
        String(user.id)
      );

      formData.append(
        "complaint_id",
        String(complaintId)
      );

      formData.append(
        "rating",
        String(rating)
      );

      formData.append(
        "comment",
        comment
      );


      const response = await fetch(
        API_URL,
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();


      Alert.alert(
        data.success
          ? "Success"
          : "Error",
        data.message
      );

    } catch (error) {

      Alert.alert(
        "Error",
        "Could not connect to server."
      );
    }
  }


  return (

    <SafeAreaView style={styles.appContainer}>

      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />


      <View style={styles.header}>

        <View>

          <Text style={styles.headerSmall}>
            HOSTEL COMPLAINT SYSTEM
          </Text>

          <Text style={styles.headerTitle}>
            Student Dashboard
          </Text>

        </View>


        <Pressable
          onPress={onLogout}
          style={styles.logoutButton}
        >

          <Text style={styles.logoutText}>
            Logout
          </Text>

        </Pressable>

      </View>


      <View style={styles.content}>

        {page === "home" && (

          <StudentHome
            user={user}
            complaints={complaints}
            navigate={navigate}
          />

        )}


        {page === "submit" && (

          <SubmitComplaint
            onSubmit={submitComplaint}
            navigate={navigate}
          />

        )}


        {page === "complaints" && (

          <MyComplaints
            complaints={complaints}
            navigate={navigate}
            refreshing={refreshing}
            reload={loadComplaints}
            onFeedback={submitFeedback}
          />

        )}


        {page === "notifications" && (

          <Notifications
            complaints={complaints}
          />

        )}

      </View>


      <StudentNavigation
        page={page}
        navigate={navigate}
      />

    </SafeAreaView>
  );
}


/* =====================================================
   STUDENT HOME
===================================================== */

function StudentHome({
  user,
  complaints,
  navigate,
}) {

  const pending = complaints.filter(
    item => item.status === "pending"
  ).length;

  const progress = complaints.filter(
    item => item.status === "in_progress"
  ).length;

  const resolved = complaints.filter(
    item => item.status === "resolved"
  ).length;


  return (

    <ScrollView
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.welcome}>
        Hello, {user.full_name}
      </Text>

      <Text style={styles.welcomeSub}>
        Submit and track your hostel complaints.
      </Text>


      <View style={styles.statsRow}>

        <StatCard
          title="Total"
          value={complaints.length}
          icon="📋"
        />

        <StatCard
          title="Pending"
          value={pending}
          icon="⏳"
        />

      </View>


      <View style={styles.statsRow}>

        <StatCard
          title="In Progress"
          value={progress}
          icon="🔄"
        />

        <StatCard
          title="Resolved"
          value={resolved}
          icon="✅"
        />

      </View>


      <Pressable
        style={styles.bigAction}
        onPress={() => navigate("submit")}
      >

        <Text style={styles.bigActionIcon}>
          📝
        </Text>

        <View>

          <Text style={styles.bigActionTitle}>
            Submit Complaint
          </Text>

          <Text style={styles.bigActionText}>
            Report a hostel problem
          </Text>

        </View>

      </Pressable>


      <Pressable
        style={styles.bigAction}
        onPress={() => navigate("complaints")}
      >

        <Text style={styles.bigActionIcon}>
          📋
        </Text>

        <View>

          <Text style={styles.bigActionTitle}>
            My Complaints
          </Text>

          <Text style={styles.bigActionText}>
            View and track your complaints
          </Text>

        </View>

      </Pressable>


      <Pressable
        style={styles.bigAction}
        onPress={() => navigate("notifications")}
      >

        <Text style={styles.bigActionIcon}>
          🔔
        </Text>

        <View>

          <Text style={styles.bigActionTitle}>
            Notifications
          </Text>

          <Text style={styles.bigActionText}>
            View complaint updates
          </Text>

        </View>

      </Pressable>

    </ScrollView>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
}) {

  return (

    <View style={styles.statCard}>

      <Text style={styles.statIcon}>
        {icon}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statTitle}>
        {title}
      </Text>

    </View>
  );
}


/* =====================================================
   SUBMIT COMPLAINT
===================================================== */

function SubmitComplaint({
  onSubmit,
  navigate,
}) {

  const [title, setTitle] = useState("");

  const [category, setCategory] =
    useState("Water");

  const [description, setDescription] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [loading, setLoading] =
    useState(false);


  async function pickImage() {

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();


    if (!permission.granted) {

      Alert.alert(
        "Permission Required",
        "Please allow access to your photos."
      );

      return;
    }


    const result =
      await ImagePicker.launchImageLibraryAsync({

        mediaTypes: ["images"],

        allowsEditing: true,

        aspect: [4, 3],

        quality: 0.8,

      });


    if (!result.canceled) {

      setImage(
        result.assets[0].uri
      );
    }
  }


  async function submit() {

    if (!title || !description) {

      Alert.alert(
        "Required",
        "Please enter complaint title and description."
      );

      return;
    }


    setLoading(true);

    await onSubmit(
      title,
      category,
      description,
      image
    );

    setLoading(false);
  }


  return (

    <ScrollView
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.pageTitle}>
        Submit Complaint
      </Text>


      <Text style={styles.label}>
        Complaint Title
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Broken water tap"
        value={title}
        onChangeText={setTitle}
      />


      <Text style={styles.label}>
        Category
      </Text>


      <View style={styles.categoryContainer}>

        {[
          "Water",
          "Electricity",
          "Sanitation",
          "Furniture",
          "Security",
          "Other",
        ].map(item => (

          <Pressable
            key={item}
            style={[
              styles.categoryButton,
              category === item &&
                styles.categorySelected,
            ]}
            onPress={() =>
              setCategory(item)
            }
          >

            <Text
              style={[
                styles.categoryText,
                category === item &&
                  styles.categorySelectedText,
              ]}
            >
              {item}
            </Text>

          </Pressable>

        ))}

      </View>


      <Text style={styles.label}>
        Description
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textarea,
        ]}
        placeholder="Describe the problem..."
        multiline
        textAlignVertical="top"
        value={description}
        onChangeText={setDescription}
      />


      <Text style={styles.label}>
        Complaint Image
      </Text>


      <Pressable
        style={styles.imagePicker}
        onPress={pickImage}
      >

        <Text style={styles.imagePickerIcon}>
          📷
        </Text>

        <Text style={styles.imagePickerText}>
          {image
            ? "Change Image"
            : "Upload Complaint Image"}
        </Text>

      </Pressable>


      {image && (

        <Image
          source={{ uri: image }}
          style={styles.previewImage}
        />

      )}


      <Pressable
        style={styles.primaryButton}
        onPress={submit}
        disabled={loading}
      >

        {loading ? (

          <ActivityIndicator
            color="#fff"
          />

        ) : (

          <Text style={styles.buttonText}>
            SUBMIT COMPLAINT
          </Text>

        )}

      </Pressable>


      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          navigate("home")
        }
      >

        <Text style={styles.secondaryButtonText}>
          Cancel
        </Text>

      </Pressable>

    </ScrollView>
  );
}


/* =====================================================
   MY COMPLAINTS
===================================================== */

function MyComplaints({
  complaints,
  navigate,
  onFeedback,
  reload,
}) {

  return (

    <ScrollView
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.pageTitle}>
        My Complaints
      </Text>


      <Pressable
        style={styles.refreshButton}
        onPress={reload}
      >

        <Text style={styles.refreshText}>
          🔄 Refresh
        </Text>

      </Pressable>


      {complaints.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyIcon}>
            📋
          </Text>

          <Text style={styles.emptyTitle}>
            No Complaints
          </Text>

          <Text style={styles.emptyText}>
            You have not submitted any complaints.
          </Text>

        </View>

      ) : (

        complaints.map(complaint => (

          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            onFeedback={onFeedback}
          />

        ))

      )}

    </ScrollView>
  );
}


/* =====================================================
   COMPLAINT CARD
===================================================== */

function ComplaintCard({
  complaint,
  onFeedback,
}) {

  const [showFeedback, setShowFeedback] =
    useState(false);

  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");


  function statusColor(status) {

    if (status === "resolved")
      return COLORS.success;

    if (status === "rejected")
      return COLORS.danger;

    if (status === "in_progress")
      return COLORS.warning;

    return COLORS.primary;
  }


  function statusText(status) {

    if (status === "in_progress")
      return "IN PROGRESS";

    return status.toUpperCase();
  }


  async function sendFeedback() {

    if (!comment.trim()) {

      Alert.alert(
        "Feedback",
        "Please enter your feedback."
      );

      return;
    }

    await onFeedback(
      complaint.id,
      rating,
      comment
    );

    setShowFeedback(false);
    setComment("");
  }


  return (

    <View style={styles.complaintCard}>

      <View style={styles.complaintHeader}>

        <Text style={styles.complaintTitle}>
          {complaint.title}
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                statusColor(
                  complaint.status
                ),
            },
          ]}
        >

          <Text style={styles.statusText}>
            {statusText(
              complaint.status
            )}
          </Text>

        </View>

      </View>


      <Text style={styles.complaintCategory}>
        {complaint.category}
      </Text>


      <Text style={styles.complaintDescription}>
        {complaint.description}
      </Text>


      {complaint.image_url && (

        <Image
          source={{
            uri: complaint.image_url,
          }}
          style={styles.complaintImage}
        />

      )}


      <View style={styles.trackingBox}>

        <Text style={styles.trackingTitle}>
          Complaint Tracking
        </Text>

        <TrackingStep
          title="Submitted"
          active={true}
        />

        <TrackingStep
          title="In Progress"
          active={[
            "in_progress",
            "resolved",
          ].includes(
            complaint.status
          )}
        />

        <TrackingStep
          title="Resolved"
          active={
            complaint.status ===
            "resolved"
          }
        />

        <TrackingStep
          title="Rejected"
          active={
            complaint.status ===
            "rejected"
          }
          danger
        />

      </View>


      {complaint.admin_note && (

        <View style={styles.adminNote}>

          <Text style={styles.adminNoteTitle}>
            Admin Response
          </Text>

          <Text style={styles.adminNoteText}>
            {complaint.admin_note}
          </Text>

        </View>

      )}


      {complaint.status === "resolved" && (

        <Pressable
          style={styles.feedbackButton}
          onPress={() =>
            setShowFeedback(
              !showFeedback
            )
          }
        >

          <Text style={styles.feedbackButtonText}>
            💬 Give Feedback
          </Text>

        </Pressable>

      )}


      {showFeedback && (

        <View style={styles.feedbackBox}>

          <Text style={styles.label}>
            Rating
          </Text>


          <View style={styles.ratingRow}>

            {[1,2,3,4,5].map(number => (

              <Pressable
                key={number}
                onPress={() =>
                  setRating(number)
                }
              >

                <Text
                  style={[
                    styles.star,
                    number <= rating &&
                      styles.starActive,
                  ]}
                >
                  ★
                </Text>

              </Pressable>

            ))}

          </View>


          <TextInput
            style={[
              styles.input,
              styles.feedbackInput,
            ]}
            placeholder="Write your feedback..."
            multiline
            value={comment}
            onChangeText={setComment}
          />


          <Pressable
            style={styles.primaryButton}
            onPress={sendFeedback}
          >

            <Text style={styles.buttonText}>
              SUBMIT FEEDBACK
            </Text>

          </Pressable>

        </View>

      )}

    </View>
  );
}


/* =====================================================
   TRACKING STEP
===================================================== */

function TrackingStep({
  title,
  active,
  danger,
}) {

  return (

    <View style={styles.trackingStep}>

      <View
        style={[
          styles.trackingCircle,
          active && {
            backgroundColor:
              danger
                ? COLORS.danger
                : COLORS.success,
          },
        ]}
      >

        <Text style={styles.trackingCircleText}>
          {active ? "✓" : ""}
        </Text>

      </View>


      <Text
        style={[
          styles.trackingText,
          active &&
            styles.trackingTextActive,
        ]}
      >
        {title}
      </Text>

    </View>
  );
}


/* =====================================================
   NOTIFICATIONS
===================================================== */

function Notifications({
  complaints,
}) {

  return (

    <ScrollView>

      <Text style={styles.pageTitle}>
        Notifications
      </Text>


      {complaints.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyIcon}>
            🔔
          </Text>

          <Text style={styles.emptyTitle}>
            No Notifications
          </Text>

        </View>

      ) : (

        complaints.map(item => (

          <View
            key={item.id}
            style={styles.notificationCard}
          >

            <Text style={styles.notificationIcon}>
              🔔
            </Text>

            <View style={{ flex: 1 }}>

              <Text style={styles.notificationTitle}>
                Complaint Update
              </Text>

              <Text style={styles.notificationText}>
                Your complaint "{item.title}"
                is currently{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {item.status === "in_progress"
                    ? "in progress"
                    : item.status}
                </Text>.
              </Text>

            </View>

          </View>

        ))

      )}

    </ScrollView>
  );
}


/* =====================================================
   STUDENT NAVIGATION
===================================================== */

function StudentNavigation({
  page,
  navigate,
}) {

  return (

    <View style={styles.bottomNav}>

      <NavButton
        icon="🏠"
        title="Home"
        active={page === "home"}
        onPress={() =>
          navigate("home")
        }
      />

      <NavButton
        icon="📝"
        title="Complaint"
        active={page === "submit"}
        onPress={() =>
          navigate("submit")
        }
      />

      <NavButton
        icon="📋"
        title="My Complaints"
        active={page === "complaints"}
        onPress={() =>
          navigate("complaints")
        }
      />

      <NavButton
        icon="🔔"
        title="Alerts"
        active={page === "notifications"}
        onPress={() =>
          navigate("notifications")
        }
      />

    </View>
  );
}


/* =====================================================
   NAV BUTTON
===================================================== */

function NavButton({
  icon,
  title,
  active,
  onPress,
}) {

  return (

    <Pressable
      style={styles.navButton}
      onPress={onPress}
    >

      <Text
        style={[
          styles.navIcon,
          active &&
            styles.navIconActive,
        ]}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.navTitle,
          active &&
            styles.navTitleActive,
        ]}
      >
        {title}
      </Text>

    </Pressable>
  );
}


/* =====================================================
   ADMIN DASHBOARD
===================================================== */
/* =====================================================
   ADMIN DASHBOARD
===================================================== */

function AdminDashboard({
  user,
  onLogout,
}) {

  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(false);

  const [updating, setUpdating] = useState(false);

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [adminNote, setAdminNote] = useState("");


  /* =====================================================
     LOAD ALL COMPLAINTS
  ===================================================== */

  async function loadComplaints() {

    setLoading(true);

    try {

      const formData = new FormData();

      formData.append(
        "action",
        "get_complaints"
      );

      formData.append(
        "user_id",
        String(user.id)
      );

      formData.append(
        "role",
        "admin"
      );


      const response = await fetch(
        API_URL,
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();


      if (data.success) {

        setComplaints(
          data.complaints || []
        );

      } else {

        Alert.alert(
          "Error",
          data.message || "Could not load complaints."
        );

      }

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Connection Error",
        "Could not connect to the server."
      );

    } finally {

      setLoading(false);

    }
  }


  /* =====================================================
     LOAD COMPLAINTS WHEN ADMIN DASHBOARD OPENS
  ===================================================== */

  useEffect(() => {

    loadComplaints();

  }, []);


  /* =====================================================
     OPEN STATUS UPDATE BOX
  ===================================================== */

  function openStatusUpdate(
    complaint,
    status
  ) {

    setSelectedComplaint({
      ...complaint,
      newStatus: status,
    });

    setAdminNote("");

  }


  /* =====================================================
     CANCEL STATUS UPDATE
  ===================================================== */

  function cancelStatusUpdate() {

    setSelectedComplaint(null);

    setAdminNote("");

  }


  /* =====================================================
     UPDATE COMPLAINT STATUS
  ===================================================== */

  async function confirmStatusUpdate() {

    if (!selectedComplaint) {
      return;
    }


    const complaintId =
      selectedComplaint.id;

    const status =
      selectedComplaint.newStatus;


    setUpdating(true);


    try {

      const formData = new FormData();

      formData.append(
        "action",
        "update_status"
      );

      formData.append(
        "complaint_id",
        String(complaintId)
      );

      formData.append(
        "status",
        status
      );

      formData.append(
        "admin_note",
        adminNote.trim()
      );


      const response = await fetch(
        API_URL,
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();


      if (data.success) {

        Alert.alert(
          "Success",
          status === "resolved"
            ? "Complaint has been resolved successfully."
            : status === "rejected"
            ? "Complaint has been rejected successfully."
            : "Complaint has been moved to In Progress."
        );


        setSelectedComplaint(null);

        setAdminNote("");


        await loadComplaints();


      } else {

        Alert.alert(
          "Update Failed",
          data.message ||
            "The complaint could not be updated."
        );

      }

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Connection Error",
        "Could not connect to the server."
      );

    } finally {

      setUpdating(false);

    }
  }


  /* =====================================================
     STATISTICS
  ===================================================== */

  const pending =
    complaints.filter(
      x => x.status === "pending"
    ).length;


  const progress =
    complaints.filter(
      x => x.status === "in_progress"
    ).length;


  const resolved =
    complaints.filter(
      x => x.status === "resolved"
    ).length;


  const rejected =
    complaints.filter(
      x => x.status === "rejected"
    ).length;


  /* =====================================================
     STATUS DISPLAY
  ===================================================== */

  function getStatusLabel(status) {

    if (status === "in_progress") {
      return "IN PROGRESS";
    }

    return status.toUpperCase();

  }


  function getStatusColor(status) {

    if (status === "resolved") {
      return COLORS.success;
    }

    if (status === "rejected") {
      return COLORS.danger;
    }

    if (status === "in_progress") {
      return COLORS.warning;
    }

    return COLORS.primary;

  }


  return (

    <SafeAreaView
      style={styles.appContainer}
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor={
          COLORS.primaryDark
        }
      />


      {/* =================================================
          ADMIN HEADER
      ================================================= */}

      <View style={styles.header}>

        <View
          style={{
            flex: 1,
            paddingRight: 10,
          }}
        >

          <Text style={styles.headerSmall}>
            HOSTEL COMPLAINT AND FEEDBACK MANAGEMENT SYSTEM
          </Text>

          <Text style={styles.headerTitle}>
            Admin Dashboard
          </Text>

        </View>


        <Pressable
          onPress={onLogout}
          style={styles.logoutButton}
        >

          <Text style={styles.logoutText}>
            Logout
          </Text>

        </Pressable>

      </View>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >


        {/* =================================================
            STATISTICS
        ================================================= */}

        <View style={styles.statsRow}>

          <StatCard
            title="Total"
            value={complaints.length}
            icon="📋"
          />


          <StatCard
            title="Pending"
            value={pending}
            icon="⏳"
          />

        </View>


        <View style={styles.statsRow}>

          <StatCard
            title="In Progress"
            value={progress}
            icon="🔄"
          />


          <StatCard
            title="Resolved"
            value={resolved}
            icon="✅"
          />

        </View>


        {/* =================================================
            REJECTED COUNT
        ================================================= */}

        {rejected > 0 && (

          <View style={styles.rejectedSummary}>

            <Text style={styles.rejectedSummaryIcon}>
              ❌
            </Text>

            <View>

              <Text style={styles.rejectedSummaryTitle}>
                Rejected Complaints
              </Text>

              <Text style={styles.rejectedSummaryValue}>
                {rejected}
              </Text>

            </View>

          </View>

        )}


        {/* =================================================
            REFRESH BUTTON
        ================================================= */}

        <Pressable
          style={styles.refreshButton}
          onPress={loadComplaints}
          disabled={loading}
        >

          {loading ? (

            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />

          ) : (

            <Text style={styles.refreshText}>
              🔄 Refresh Complaints
            </Text>

          )}

        </Pressable>


        <Text style={styles.sectionHeading}>
          All Student Complaints
        </Text>


        {/* =================================================
            COMPLAINT LIST
        ================================================= */}

        {loading ? (

          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{
              marginTop: 30,
            }}
          />

        ) : complaints.length === 0 ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyIcon}>
              📋
            </Text>

            <Text style={styles.emptyTitle}>
              No complaints
            </Text>

            <Text style={styles.emptyText}>
              There are currently no student complaints.
            </Text>

          </View>

        ) : (

          complaints.map(item => (

            <View
              key={item.id}
              style={styles.adminComplaint}
            >


              {/* =========================================
                  COMPLAINT HEADER
              ========================================= */}

              <View style={styles.complaintHeader}>

                <View
                  style={{
                    flex: 1,
                    paddingRight: 8,
                  }}
                >

                  <Text style={styles.complaintTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.studentName}>
                    Student: {item.full_name}
                  </Text>

                  <Text style={styles.studentName}>
                    Room: {item.room_no || "N/A"}
                  </Text>

                </View>


                <View
                  style={[
                    styles.adminStatusBadge,
                    {
                      backgroundColor:
                        getStatusColor(
                          item.status
                        ),
                    },
                  ]}
                >

                  <Text
                    style={
                      styles.adminStatusBadgeText
                    }
                  >
                    {getStatusLabel(
                      item.status
                    )}
                  </Text>

                </View>

              </View>


              {/* =========================================
                  CATEGORY
              ========================================= */}

              <Text
                style={
                  styles.complaintCategory
                }
              >
                {item.category}
              </Text>


              {/* =========================================
                  DESCRIPTION
              ========================================= */}

              <Text
                style={
                  styles.complaintDescription
                }
              >
                {item.description}
              </Text>


              {/* =========================================
                  IMAGE
              ========================================= */}

              {item.image_url && (

                <Image
                  source={{
                    uri: item.image_url,
                  }}
                  style={
                    styles.complaintImage
                  }
                />

              )}


              {/* =========================================
                  EXISTING ADMIN NOTE
              ========================================= */}

              {item.admin_note && (

                <View
                  style={
                    styles.adminExistingNote
                  }
                >

                  <Text
                    style={
                      styles.adminExistingNoteTitle
                    }
                  >
                    Previous Admin Response
                  </Text>

                  <Text
                    style={
                      styles.adminExistingNoteText
                    }
                  >
                    {item.admin_note}
                  </Text>

                </View>

              )}


              {/* =========================================
                  ADMIN ACTION BUTTONS
              ========================================= */}

              {item.status !== "resolved" &&
                item.status !== "rejected" && (

                <View
                  style={styles.adminActions}
                >

                  <Pressable
                    style={
                      styles.progressButton
                    }
                    onPress={() =>
                      openStatusUpdate(
                        item,
                        "in_progress"
                      )
                    }
                  >

                    <Text
                      style={
                        styles.adminButtonText
                      }
                    >
                      In Progress
                    </Text>

                  </Pressable>


                  <Pressable
                    style={
                      styles.resolveButton
                    }
                    onPress={() =>
                      openStatusUpdate(
                        item,
                        "resolved"
                      )
                    }
                  >

                    <Text
                      style={
                        styles.adminButtonText
                      }
                    >
                      Resolve
                    </Text>

                  </Pressable>


                  <Pressable
                    style={
                      styles.rejectButton
                    }
                    onPress={() =>
                      openStatusUpdate(
                        item,
                        "rejected"
                      )
                    }
                  >

                    <Text
                      style={
                        styles.adminButtonText
                      }
                    >
                      Reject
                    </Text>

                  </Pressable>

                </View>

              )}


              {/* =========================================
                  REOPEN / CHANGE STATUS
              ========================================= */}

              {(item.status === "resolved" ||
                item.status === "rejected") && (

                <Pressable
                  style={
                    styles.changeStatusButton
                  }
                  onPress={() =>
                    openStatusUpdate(
                      item,
                      "in_progress"
                    )
                  }
                >

                  <Text
                    style={
                      styles.changeStatusText
                    }
                  >
                    🔄 Change Status
                  </Text>

                </Pressable>

              )}

            </View>

          ))

        )}

      </ScrollView>


      {/* =================================================
          ADMIN RESPONSE MODAL
      ================================================= */}

      {selectedComplaint && (

        <View style={styles.modalOverlay}>

          <View style={styles.statusModal}>

            <Text style={styles.modalTitle}>
              Update Complaint
            </Text>


            <Text style={styles.modalComplaintTitle}>
              {selectedComplaint.title}
            </Text>


            <View
              style={[
                styles.modalStatusBadge,
                {
                  backgroundColor:
                    getStatusColor(
                      selectedComplaint.newStatus
                    ),
                },
              ]}
            >

              <Text
                style={
                  styles.modalStatusText
                }
              >
                {getStatusLabel(
                  selectedComplaint.newStatus
                )}
              </Text>

            </View>


            <Text style={styles.label}>
              Response to Student
            </Text>


            <TextInput
              style={[
                styles.input,
                styles.adminResponseInput,
              ]}
              placeholder={
                selectedComplaint.newStatus ===
                "resolved"
                  ? "Explain how the complaint was resolved..."
                  : selectedComplaint.newStatus ===
                    "rejected"
                  ? "Explain why the complaint was rejected..."
                  : "Enter an update for the student..."
              }
              placeholderTextColor={
                COLORS.muted
              }
              multiline
              textAlignVertical="top"
              value={adminNote}
              onChangeText={setAdminNote}
            />


            <View
              style={
                styles.modalButtons
              }
            >

              <Pressable
                style={
                  styles.modalCancelButton
                }
                onPress={
                  cancelStatusUpdate
                }
                disabled={updating}
              >

                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  Cancel
                </Text>

              </Pressable>


              <Pressable
                style={[
                  styles.modalConfirmButton,
                  {
                    backgroundColor:
                      getStatusColor(
                        selectedComplaint.newStatus
                      ),
                  },
                ]}
                onPress={
                  confirmStatusUpdate
                }
                disabled={updating}
              >

                {updating ? (

                  <ActivityIndicator
                    color={COLORS.white}
                  />

                ) : (

                  <Text
                    style={
                      styles.modalConfirmText
                    }
                  >
                    Confirm
                  </Text>

                )}

              </Pressable>

            </View>

          </View>

        </View>

      )}

    </SafeAreaView>
  );
}
/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 15,
    color: COLORS.muted,
  },

  authContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  logoIcon: {
    fontSize: 42,
  },

  appTitle: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
  },

  appSubtitle: {
    textAlign: "center",
    color: "#D9ECF7",
    marginTop: 5,
    marginBottom: 25,
    fontSize: 13,
  },

  authCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 22,
  },

  authTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FAFBFC",
    color: COLORS.text,
  },

  primaryButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },

  switchButton: {
    padding: 15,
    alignItems: "center",
  },

  switchText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  appContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerSmall: {
    color: "#B9DDED",
    fontSize: 10,
    fontWeight: "bold",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 3,
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#B9DDED",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },

  logoutText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },

  content: {
    flex: 1,
    padding: 16,
  },

  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 5,
  },

  welcomeSub: {
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  statIcon: {
    fontSize: 22,
  },

  statValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 8,
  },

  statTitle: {
    color: COLORS.muted,
    marginTop: 2,
    fontSize: 12,
  },

  bigAction: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 17,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  bigActionIcon: {
    fontSize: 30,
    marginRight: 15,
  },

  bigActionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },

  bigActionText: {
    color: COLORS.muted,
    marginTop: 3,
    fontSize: 12,
  },

  bottomNav: {
    height: 70,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  navButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  navIcon: {
    fontSize: 21,
    opacity: 0.55,
  },

  navIconActive: {
    opacity: 1,
  },

  navTitle: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 3,
  },

  navTitleActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },

  categorySelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryText: {
    color: COLORS.text,
    fontSize: 12,
  },

  categorySelectedText: {
    color: COLORS.white,
    fontWeight: "bold",
  },

  textarea: {
    height: 130,
    paddingTop: 12,
  },

  imagePicker: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    marginTop: 5,
  },

  imagePickerIcon: {
    fontSize: 35,
  },

  imagePickerText: {
    marginTop: 8,
    color: COLORS.primary,
    fontWeight: "bold",
  },

  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },

  secondaryButton: {
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: COLORS.white,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: "bold",
  },

  refreshButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  refreshText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },

  complaintCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  complaintHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  complaintTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  statusText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "bold",
  },

  complaintCategory: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 8,
  },

  complaintDescription: {
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 8,
  },

  complaintImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginTop: 12,
  },

  trackingBox: {
    backgroundColor: "#F5F8FA",
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },

  trackingTitle: {
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },

  trackingStep: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },

  trackingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D5DDE4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  trackingCircleText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 11,
  },

  trackingText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  trackingTextActive: {
    color: COLORS.text,
    fontWeight: "bold",
  },

  adminNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderRadius: 6,
  },

  adminNoteTitle: {
    fontWeight: "bold",
    color: COLORS.primary,
  },

  adminNoteText: {
    marginTop: 4,
    color: COLORS.text,
  },

  feedbackButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },

  feedbackButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },

  feedbackBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  ratingRow: {
    flexDirection: "row",
    marginTop: 5,
  },

  star: {
    fontSize: 32,
    color: "#D5D5D5",
    marginRight: 5,
  },

  starActive: {
    color: "#F59E0B",
  },

  feedbackInput: {
    height: 90,
    paddingTop: 10,
    marginTop: 8,
  },

  notificationCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    elevation: 1,
  },

  notificationIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  notificationTitle: {
    fontWeight: "bold",
    color: COLORS.text,
  },

  notificationText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 18,
  },

  emptyBox: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15,
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 10,
  },

  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 5,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },

  adminComplaint: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },

  studentName: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  adminStatus: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  adminActions: {
    flexDirection: "row",
    gap: 7,
    marginTop: 12,
  },

  progressButton: {
    flex: 1,
    backgroundColor: COLORS.warning,
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  resolveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  rejectButton: {
    flex: 1,
    backgroundColor: COLORS.danger,
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  adminButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },

});
