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
import Layout from '@/components/layout1';
import { Check, Clock, Search, UserMinus, UserPlus, Users } from 'lucide-react';

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
    <Layout>
      <div className="container mx-auto p-4 space-y-6 mt-16 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold dark:text-white">Add Friends</h1>
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-sm font-medium">
                {friendsList.length} Friends
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="search" className="data-[state=active]:bg-primary">
              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary">
              <Clock className="w-4 h-4 mr-2" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="received" className="data-[state=active]:bg-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Received
            </TabsTrigger>
            <TabsTrigger value="friends" className="data-[state=active]:bg-primary">
              <Users className="w-4 h-4 mr-2" />
              Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle>Find New Friends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search by email address"
                    className="pl-10"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {filteredUsers.map(user => (
                    <div key={user.id} 
                         className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profilePicture || '/default-profile.png'} alt={user.email} />
                          <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          {pendingRequests.some(req => req.to === user.uid) && (
                            <span className="text-sm text-muted-foreground">Request Pending</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => sendFriendRequest(user.uid)}
                        disabled={pendingRequests.some(req => req.to === user.uid)}
                        className="ml-4"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map(request => (
                      <div key={request.id} 
                           className="flex items-center justify-between p-4 rounded-lg bg-card">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage 
                              src={allUsers.find(user => user.id === request.to)?.profilePicture || '/default-profile.png'}
                              alt={allUsers.find(user => user.id === request.to)?.email}
                            />
                            <AvatarFallback>
                              {allUsers.find(user => user.id === request.to)?.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {allUsers.find(user => user.id === request.to)?.email}
                          </span>
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={() => cancelFriendRequest(request.id)}
                          size="sm"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Received Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No received requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedRequests.map(request => (
                      <div key={request.id} 
                           className="flex items-center justify-between p-4 rounded-lg bg-card">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage 
                              src={allUsers.find(user => user.id === request.from)?.profilePicture || '/default-profile.png'}
                              alt={allUsers.find(user => user.id === request.from)?.email}
                            />
                            <AvatarFallback>
                              {allUsers.find(user => user.id === request.from)?.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {allUsers.find(user => user.id === request.from)?.email}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => acceptFriendRequest(request.id)}
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Friends List</CardTitle>
              </CardHeader>
              <CardContent>
                {friendsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No friends added yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {friendsList.map(friend => (
                      <div key={friend.id} 
                           className="flex items-center space-x-4 p-4 rounded-lg bg-card">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.profilePicture || '/default-profile.png'} alt={friend.email} />
                          <AvatarFallback>{friend.email?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.email}</p>
                          <p className="text-sm text-muted-foreground">Friend</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const AddFriendsPageWrapper: React.FC = () => {
  return (
    <DarkModeProvider>
      <AddFriendsPage />
    </DarkModeProvider>
  );
};

export default AddFriendsPageWrapper;
