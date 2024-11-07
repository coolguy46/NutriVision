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
  const [searchedUser, setSearchedUser] = useState<any | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  if (user){
    const userDocRef = doc(db, 'users', user.uid);
    updateDoc(userDocRef, { email : user.email })
  }

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch all users but keep them private
          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);

          const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            uid: doc.id,
            ...doc.data(),
          }));

          setAllUsers(users.filter(u => u.uid !== user.uid));

          // Fetch pending friend requests
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

          // Fetch friends list
          const friendsQuery = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('from', 'in', [user.uid])
          );
          const friendsSnapshot = await getDocs(friendsQuery);

          const friends = friendsSnapshot.docs.map(doc => {
            const data = doc.data();
            const friendId = data.from === user.uid ? data.to : data.from;
            return { friendId, ...data };
          });

          const receivedAcceptedQuery = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('to', '==', user.uid)
          );
          const receivedAcceptedSnapshot = await getDocs(receivedAcceptedQuery);
          const receivedAcceptedFriends = receivedAcceptedSnapshot.docs.map(doc => {
            const data = doc.data();
            const friendId = data.from;
            return { friendId, ...data };
          });

          const allFriends = [...friends, ...receivedAcceptedFriends];
          const friendsData = allFriends.map(f => users.find(u => u.uid === f.friendId)).filter(Boolean);
          setFriendsList(friendsData);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchedUser(null); // Reset searched user when input changes
    setError(null); // Reset error when input changes
  };

  const searchExactEmail = () => {
    if (!searchQuery) {
      setError("Please enter an email address");
      return;
    }

    const foundUser = allUsers.find(u => u.email?.toLowerCase() === searchQuery.toLowerCase());
    
    if (!foundUser) {
      setError("No user found with this email address");
      return;
    }

    // Check if already friends
    if (friendsList.some(friend => friend.uid === foundUser.uid)) {
      setError("You're already friends with this user");
      return;
    }

    // Check if request already pending
    if (pendingRequests.some(req => req.to === foundUser.uid)) {
      setError("You already have a pending request to this user");
      return;
    }

    setSearchedUser(foundUser);
    setError(null);
  };

  const sendFriendRequest = async (recipientId: string) => {
    if (user) {
      try {
        await addDoc(collection(db, 'friend_requests'), {
          from: user.uid,
          to: recipientId,
          status: 'pending'
        });
        
        const updatedPendingRequests = await getDocs(query(
          collection(db, 'friend_requests'), 
          where('from', '==', user.uid), 
          where('status', '==', 'pending')
        ));
        
        setPendingRequests(updatedPendingRequests.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSearchedUser(null);
        setSearchQuery('');
        setError("Friend request sent successfully!");
      } catch (error) {
        console.error('Error sending friend request:', error);
        setError("Failed to send friend request. Please try again.");
      }
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    const requestDocRef = doc(db, 'friend_requests', requestId);
    try {
      await updateDoc(requestDocRef, { status: 'accepted' });
      const updatedReceivedRequests = await getDocs(query(
        collection(db, 'friend_requests'), 
        where('to', '==', user?.uid), 
        where('status', '==', 'pending')
      ));
      setReceivedRequests(updatedReceivedRequests.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    const requestDocRef = doc(db, 'friend_requests', requestId);
    try {
      await deleteDoc(requestDocRef);
      const updatedPendingRequests = await getDocs(query(
        collection(db, 'friend_requests'), 
        where('from', '==', user?.uid), 
        where('status', '==', 'pending')
      ));
      setPendingRequests(updatedPendingRequests.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error canceling friend request:', error);
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
                <CardTitle>Find Friends by Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={searchQuery}
                      onChange={handleSearch}
                      placeholder="Enter exact email address"
                      className="flex-1"
                    />
                    <Button onClick={searchExactEmail}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  {error && (
                    <Alert variant={error.includes("successfully") ? "default" : "destructive"}>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {searchedUser && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={searchedUser.profilePicture || '/default-profile.png'} alt={searchedUser.email} />
                          <AvatarFallback>{searchedUser.email?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{searchedUser.email}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => sendFriendRequest(searchedUser.uid)}
                        className="ml-4"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rest of the tabs remain the same */}
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
                            ></AvatarImage>
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
                                
