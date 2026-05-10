import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../api';

export const AppContext = createContext(null);

// Module-level token cache — api.js reads auth.currentUser.getIdToken() directly,
// but this export lets other modules get a synchronous snapshot if needed.
let _idToken = null;
export function getIdToken() {
  return _idToken;
}

function mapFirebaseError(err) {
  switch (err.code) {
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    default:
      return err.message;
  }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users,    setUsers]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Session restoration — Firebase fires this once on mount with the persisted
  // session (or null), then again on every sign-in / sign-out.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Refresh token into module-level cache
          _idToken = await firebaseUser.getIdToken(false);

          // First authenticated request auto-provisions the user row in the DB.
          // We load all users then find ourselves by email.
          const [allUsers, allProjects, allTasks] = await Promise.all([
            api.getUsers(),
            api.getProjects(),
            api.getTasks(),
          ]);

          const me = (allUsers || []).find(u => u.email === firebaseUser.email) || null;
          const filteredProjects = me?.role === 'Admin' 
            ? (allProjects || [])
            : (allProjects || []).filter(p => p.leadId === me?.id || p.memberIds?.includes(me?.id));

          setCurrentUser(me);
          setUsers(allUsers || []);
          setProjects(filteredProjects);
          setTasks(allTasks || []);
        } catch {
          // If backend calls fail, still mark loading as done
          _idToken = null;
          setCurrentUser(null);
          setUsers([]);
          setProjects([]);
          setTasks([]);
        }
      } else {
        _idToken = null;
        setCurrentUser(null);
        setUsers([]);
        setProjects([]);
        setTasks([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged fires automatically and loads all state
      return { success: true };
    } catch (err) {
      return { error: mapFirebaseError(err) };
    }
  };

  const signup = async ({ name, email, password }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      // onAuthStateChanged fires automatically — backend auto-provisions the user row
      return { success: true };
    } catch (err) {
      return { error: mapFirebaseError(err) };
    }
  };

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged clears all state
  };

  // Projects
  const createProject = async (data) => {
    try {
      const project = await api.createProject(data);
      setProjects(prev => [project, ...prev]);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const updateProject = async (id, updates) => {
    try {
      console.log('[updateProject] sending:', { id, updates });
      const project = await api.updateProject(id, updates);
      console.log('[updateProject] response:', project);
      setProjects(prev => prev.map(p => {
        const match = p.id === id;
        if (match) console.log('[updateProject] replacing project in state:', { old: p, new: project });
        return match ? project : p;
      }));
      return { success: true };
    } catch (err) {
      console.error('[updateProject] error:', err.message);
      return { error: err.message };
    }
  };

  const deleteProject = async (id) => {
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  // Tasks
  const createTask = async (data) => {
    try {
      const task = await api.createTask(data);
      setTasks(prev => [task, ...prev]);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const task = await api.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? task : t));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      const task = await api.updateStatus(id, status);
      setTasks(prev => prev.map(t => t.id === id ? task : t));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  // Users (admin-only in UI)
  const inviteUser = async ({ name, email, role }) => {
    try {
      const user = await api.inviteUser({ name, email, role });
      setUsers(prev => [...prev, user]);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const user = await api.updateRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? user : u));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const removeUser = async (userId) => {
    try {
      await api.removeUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <AppContext.Provider value={{
      currentUser, users, projects, tasks, loading, isAdmin,
      login, signup, logout,
      createProject, updateProject, deleteProject,
      createTask, updateTask, updateTaskStatus, deleteTask,
      inviteUser, updateUserRole, removeUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
