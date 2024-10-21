"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebaseConfig';
import { getDownloadURL, listAll, ref, getMetadata } from 'firebase/storage';
import HeaderMenu from '@/components/HeaderMenu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import '@/app/globals.css'
import { DarkModeProvider, useDarkMode } from '@/components/DarkModeContext';

const AddFriendsPage: React.FC = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]); // State for friends list
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null); // State for error messages
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  if (user){
    const userDocRef = doc(db, 'users', user.uid);
    updateDoc(userDocRef, { email : user.email })
  }

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch all users
          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);

          const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            uid: doc.id, // Ensure uid is always present
            ...doc.data(),
          }));

          // Filter users locally
          const filteredUsers = users.filter(u => u.uid !== user.uid);

          // Fetch the latest profile pictures from Firebase Storage
          const usersWithProfilePictures = await Promise.all(
            filteredUsers.map(async user => {
              try {
                const userFolderRef = ref(storage, `profile_pictures/${user.uid}`);
                const fileList = await listAll(userFolderRef);

                if (fileList.items.length > 0) {
                  // Sort files by creation time to find the latest uploaded picture
                  const sortedFiles = await Promise.all(
                    fileList.items.map(async fileRef => {
                      const metadata = await getMetadata(fileRef); // Fetch metadata using getMetadata function
                      return {
                        ref: fileRef,
                        timeCreated: new Date(metadata.timeCreated)
                      };
                    })
                  );

                  const latestFile = sortedFiles.sort((a, b) => b.timeCreated.getTime() - a.timeCreated.getTime())[0];
                  const profilePicURL = await getDownloadURL(latestFile.ref);

                  return { ...user, profilePicture: profilePicURL };
                } else {
                  return { ...user, profilePicture: null }; // No profile picture found
                }
              } catch (error) {
                console.error(`Error fetching profile picture for user ${user.uid}:`, error);
                return { ...user, profilePicture: null }; // If no profile picture found or error occurs
              }
            })
          );

          setAllUsers(usersWithProfilePictures);
          setFilteredUsers(usersWithProfilePictures);

          // Fetch pending friend requests from the current user
          const pendingRequestsQuery = query(
            collection(db, 'friend_requests'),
            where('from', '==', user.uid),
            where('status', '==', 'pending')
          );
          const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);
          const pendingRequests = pendingRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPendingRequests(pendingRequests);

          // Fetch received friend requests
          const receivedRequestsQuery = query(
            collection(db, 'friend_requests'),
            where('to', '==', user.uid),
            where('status', '==', 'pending')
          );
          const receivedRequestsSnapshot = await getDocs(receivedRequestsQuery);
          const receivedRequests = receivedRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReceivedRequests(receivedRequests);

          // Fetch accepted friend requests (friends list)
          const friendsQuery = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('from', 'in', [user.uid]) // Your sent requests that were accepted
          );
          const friendsSnapshot = await getDocs(friendsQuery);

          // Include both sent and received accepted requests
          const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            const friendId = data.from === user.uid ? data.to : data.from;
            return { friendId, ...data };
          });

          // Fetch accepted requests you received
          const receivedAcceptedQuery = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('to', '==', user.uid) // Requests you received and accepted
          );
          const receivedAcceptedSnapshot = await getDocs(receivedAcceptedQuery);
          const receivedAcceptedFriends = receivedAcceptedSnapshot.docs.map(doc => {
            const data = doc.data();
            const friendId = data.from;
            return { friendId, ...data };
          });

          // Combine both lists
          const allFriends = [...friends, ...receivedAcceptedFriends];

          // Map friends to user data
          const friendsData = allFriends.map(f => usersWithProfilePictures.find(u => u.uid === f.friendId));

          setFriendsList(friendsData);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [user]);

  const sendFriendRequest = async (recipientId: string) => {
    if (user) {
      try {
        // Check if the user is already a friend
        const isAlreadyFriend = friendsList.some(friend => friend.uid === recipientId);
        if (isAlreadyFriend) {
          setError("You can't send a friend request to someone you're already friends with.");
          return;
        }

        await addDoc(collection(db, 'friend_requests'), {
          from: user.uid,
          to: recipientId,
          status: 'pending'
        });
        // Refresh pending requests after sending a new request
        const updatedPendingRequests = await getDocs(query(collection(db, 'friend_requests'), where('from', '==', user.uid), where('status', '==', 'pending')));
        setPendingRequests(updatedPendingRequests.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setError(null); // Clear any previous error
      } catch (error) {
        console.error('Error sending friend request:', error);
      }
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    const requestDocRef = doc(db, 'friend_requests', requestId);
    try {
      await updateDoc(requestDocRef, { status: 'accepted' });
      // Refresh received requests after accepting
      const updatedReceivedRequests = await getDocs(query(collection(db, 'friend_requests'), where('to', '==', user?.uid), where('status', '==', 'pending')));
      setReceivedRequests(updatedReceivedRequests.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    const requestDocRef = doc(db, 'friend_requests', requestId);
    try {
      await deleteDoc(requestDocRef);
      // Refresh pending requests after canceling
      const updatedPendingRequests = await getDocs(query(collection(db, 'friend_requests'), where('from', '==', user?.uid), where('status', '==', 'pending')));
      setPendingRequests(updatedPendingRequests.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  // Function to filter users based on the search query
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => user.email?.toLowerCase().includes(query));
      setFilteredUsers(filtered);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8 mt-16 dark:text-white">
      <HeaderMenu />
      <h1 className="text-3xl font-bold dark:text-white">Add Friends</h1>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by email"
                className="mb-4"
              />

              {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

              <ul className="space-y-2">
                {filteredUsers.map(user => (
                  <li key={user.id} className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center">
                      <Avatar className="mr-2">
                        <AvatarImage src={user.profilePicture || '/default-profile.png'} alt={user.email} />
                        <AvatarFallback>{user.email}</AvatarFallback>
                      </Avatar>
                      <span>{user.email}</span>
                    </div>
                    <Button onClick={() => sendFriendRequest(user.uid)}>Add Friend</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {pendingRequests.map(request => (
                  <li key={request.id} className="flex items-center justify-between p-2 border-b">
                    <span>Request to: {allUsers.find(user => user.id === request.to)?.email}</span>
                    <Button variant="destructive" onClick={() => cancelFriendRequest(request.id)}>Cancel Request</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Received Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {receivedRequests.map(request => (
                  <li key={request.id} className="flex items-center justify-between p-2 border-b">
                    <span>Request from: {allUsers.find(user => user.id === request.from)?.email}</span>
                    <Button variant="outline" onClick={() => acceptFriendRequest(request.id)}>Accept</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Friends List</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {friendsList.map(friend => (
                  <li key={friend.id} className="flex items-center p-2 border-b">
                    <Avatar className="mr-2">
                      <AvatarImage src={friend.profilePicture || '/default-profile.png'} alt={friend.email} />
                      <AvatarFallback>{friend.email}</AvatarFallback>
                    </Avatar>
                    <span>{friend.email}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
const Goalspage: React.FC = () => {
  return (
    <DarkModeProvider>
      <AddFriendsPage />
    </DarkModeProvider>
  )
}
export default Goalspage;
